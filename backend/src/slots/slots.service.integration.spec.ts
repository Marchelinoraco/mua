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
