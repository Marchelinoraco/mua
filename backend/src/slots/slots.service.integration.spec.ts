// Muat .env terlebih dulu — jest tidak memuat env otomatis seperti Nest
// ConfigModule saat runtime; test ini menyambung PrismaService langsung
// tanpa bootstrap AppModule, sehingga DATABASE_URL harus dimuat manual di sini.
import 'dotenv/config';
import { BookingStatus, ServiceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from './slots.service';

/**
 * Integration test AC-F05-1: "Tidak ada dua booking aktif pada slot yang
 * sama (diuji dengan submit bersamaan)".
 *
 * Test ini terhubung ke DB dev nyata (Neon, via DATABASE_URL di .env) — BUKAN
 * mock — supaya `pg_advisory_xact_lock` benar-benar diuji lintas transaksi
 * paralel (mock Prisma tidak bisa mensimulasikan locking di level Postgres).
 * Seluruh data yang dibuat berprefiks unik & dibersihkan di afterAll.
 *
 * Jika DATABASE_URL tidak tersedia (mis. CI tanpa akses DB), suite di-skip
 * otomatis alih-alih gagal — lihat `describeIfDb` di bawah.
 */
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb(
  'SlotsService.reserveSlotOrThrow — race condition (AC-F05-1, integrasi)',
  () => {
    let prisma: PrismaService;
    let slotsService: SlotsService;
    let tenantId: string;
    let userId: string;
    let clientId: string;
    let serviceId: string;

    // Tanggal jauh di masa depan supaya tidak bentrok dengan data nyata mana pun.
    const testDate = new Date('2027-03-15T09:00:00.000Z');

    beforeAll(async () => {
      prisma = new PrismaService();
      slotsService = new SlotsService(prisma);
      await prisma.$connect();

      const suffix = `f05race${Date.now()}`;

      const user = await prisma.user.create({
        data: { email: `${suffix}@test.local`, passwordHash: 'x' },
      });
      userId = user.id;

      const tenant = await prisma.tenant.create({
        data: {
          ownerUserId: user.id,
          slug: suffix.slice(0, 30),
          namaBisnis: 'Test F05 Race Condition',
        },
      });
      tenantId = tenant.id;

      const hari = testDate.getUTCDay();
      await prisma.availability.create({
        data: {
          tenantId,
          hari,
          jamMulai: 0,
          jamSelesai: 1440,
          slotDurasi: 60,
          kapasitas: 1, // kapasitas 1 -> hanya 1 booking aktif boleh lolos
        },
      });

      const client = await prisma.client.create({
        data: { tenantId, nama: 'Klien Test Race', phone: `08${Date.now()}` },
      });
      clientId = client.id;

      const service = await prisma.service.create({
        data: {
          tenantId,
          nama: 'Layanan Test Race',
          harga: 100_000,
          durasi: 60,
          tipe: ServiceType.MAKEUP,
          dpNilai: 30,
        },
      });
      serviceId = service.id;
    }, 30_000);

    afterAll(async () => {
      // Booking dihapus eksplisit LEBIH DULU (cascade ke BookingItem) — BookingItem.serviceId
      // TIDAK cascade dari Service (Service sengaja tidak pernah hard-delete di produksi,
      // lihat services.service.ts), jadi kalau Tenant dihapus duluan, cascade Tenant->Service
      // bisa lebih dulu jalan daripada Tenant->Booking->BookingItem dan menabrak FK
      // BookingItem_serviceId_fkey. Urutan: Booking -> Tenant (cascade sisanya) -> User.
      await prisma.booking.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });
      await prisma.user.delete({ where: { id: userId } });
      await prisma.$disconnect();
    }, 30_000);

    it('dua transaksi paralel pada slot kapasitas 1 -> tepat satu sukses', async () => {
      const attemptReserveAndBook = (kodeBooking: string) =>
        prisma.$transaction(async (tx) => {
          await slotsService.reserveSlotOrThrow(tx, tenantId, testDate, 60);
          return tx.booking.create({
            data: {
              tenantId,
              clientId,
              kodeBooking,
              tanggalAcara: testDate,
              totalHarga: 100_000,
              dpAmount: 30_000,
              statusBooking: BookingStatus.AWAITING_DP,
              holdUntil: new Date(Date.now() + 120 * 60 * 1000),
              items: {
                create: [
                  {
                    serviceId,
                    namaSnapshot: 'Layanan Test Race',
                    hargaSnapshot: 100_000,
                    durasi: 60,
                  },
                ],
              },
            },
          });
        });

      const results = await Promise.allSettled([
        attemptReserveAndBook('GB-RACE-0001'),
        attemptReserveAndBook('GB-RACE-0002'),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );

      // AC-F05-1: tepat satu sukses, satu gagal.
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      const rejectionReason: unknown = rejected[0].reason;
      expect(rejectionReason).toBeInstanceOf(Error);
      expect((rejectionReason as Error).message).toContain(
        'Slot baru saja terisi',
      );

      // Pastikan tidak ada double-book tersimpan di DB.
      const bookingCount = await prisma.booking.count({ where: { tenantId } });
      expect(bookingCount).toBe(1);
    }, 30_000);
  },
);

/**
 * Integration test F09 (AC-F09-2 + bug fix self-conflict reschedule):
 * "booking jam 09:00 durasi 120m, reschedule ke 10:00 tanggal sama, kapasitas
 * 1 -> harus BERHASIL". Tanpa `excludeBookingId`, booking yang di-reschedule
 * bentrok dengan DIRINYA SENDIRI (rentang lama 09:00-11:00 beririsan dengan
 * rentang baru 10:00-12:00) — false conflict. Dengan `excludeBookingId`
 * terisi id booking tsb, baris itu dikecualikan dari kandidat okupansi
 * sehingga reservasi ke slot baru berhasil walau kapasitas hanya 1.
 *
 * Sama seperti suite di atas: butuh Postgres asli (Neon dev via
 * DATABASE_URL) karena reserveSlotOrThrow memakai pg_advisory_xact_lock.
 */
describeIfDb(
  'SlotsService.reserveSlotOrThrow — self-conflict reschedule (F09, AC-F09-2)',
  () => {
    let prisma: PrismaService;
    let slotsService: SlotsService;
    let tenantId: string;
    let userId: string;
    let clientId: string;
    let serviceId: string;
    let bookingId: string;

    // Tanggal jauh di masa depan, beda dari suite race condition di atas.
    const testDate = new Date('2027-04-20T09:00:00.000Z'); // 09:00 UTC

    beforeAll(async () => {
      prisma = new PrismaService();
      slotsService = new SlotsService(prisma);
      await prisma.$connect();

      const suffix = `f09reschedule${Date.now()}`;

      const user = await prisma.user.create({
        data: { email: `${suffix}@test.local`, passwordHash: 'x' },
      });
      userId = user.id;

      const tenant = await prisma.tenant.create({
        data: {
          ownerUserId: user.id,
          slug: suffix.slice(0, 30),
          namaBisnis: 'Test F09 Reschedule Self-Conflict',
        },
      });
      tenantId = tenant.id;

      const hari = testDate.getUTCDay();
      await prisma.availability.create({
        data: {
          tenantId,
          hari,
          jamMulai: 0,
          jamSelesai: 1440,
          slotDurasi: 60,
          kapasitas: 1, // kapasitas 1 -> tanpa fix, reschedule ke slot beririsan pasti "bentrok"
        },
      });

      const client = await prisma.client.create({
        data: {
          tenantId,
          nama: 'Klien Test Reschedule',
          phone: `08${Date.now()}`,
        },
      });
      clientId = client.id;

      const service = await prisma.service.create({
        data: {
          tenantId,
          nama: 'Layanan Test Reschedule',
          harga: 100_000,
          durasi: 120,
          tipe: ServiceType.MAKEUP,
          dpNilai: 30,
        },
      });
      serviceId = service.id;

      // Booking existing jam 09:00, durasi 120m (09:00-11:00).
      const booking = await prisma.booking.create({
        data: {
          tenantId,
          clientId,
          kodeBooking: 'GB-RESCHEDULE-0001',
          tanggalAcara: testDate,
          totalHarga: 100_000,
          dpAmount: 30_000,
          statusBooking: BookingStatus.CONFIRMED, // kunci permanen, holdUntil null
          items: {
            create: [
              {
                serviceId,
                namaSnapshot: 'Layanan Test Reschedule',
                hargaSnapshot: 100_000,
                durasi: 120,
              },
            ],
          },
        },
      });
      bookingId = booking.id;
    }, 30_000);

    afterAll(async () => {
      await prisma.booking.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });
      await prisma.user.delete({ where: { id: userId } });
      await prisma.$disconnect();
    }, 30_000);

    it('TANPA excludeBookingId -> false conflict (bentrok dengan dirinya sendiri)', async () => {
      const targetTanggal = new Date('2027-04-20T10:00:00.000Z'); // 10:00, beririsan dgn 09:00-11:00 lama

      await expect(
        prisma.$transaction(async (tx) => {
          await slotsService.reserveSlotOrThrow(
            tx,
            tenantId,
            targetTanggal,
            120,
          );
        }),
      ).rejects.toThrow('Slot baru saja terisi.');
    }, 30_000);

    it('DENGAN excludeBookingId=id booking ini -> reschedule ke 10:00 tanggal sama BERHASIL', async () => {
      const targetTanggal = new Date('2027-04-20T10:00:00.000Z');

      await prisma.$transaction(async (tx) => {
        await slotsService.reserveSlotOrThrow(
          tx,
          tenantId,
          targetTanggal,
          120,
          bookingId, // exclude diri sendiri dari perhitungan okupansi
        );
        await tx.booking.update({
          where: { id: bookingId },
          data: { tanggalAcara: targetTanggal },
        });
      });

      const updated = await prisma.booking.findUniqueOrThrow({
        where: { id: bookingId },
        select: { tanggalAcara: true },
      });
      expect(updated.tanggalAcara).toEqual(targetTanggal);
    }, 30_000);
  },
);
