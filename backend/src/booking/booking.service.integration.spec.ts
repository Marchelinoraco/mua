// Muat .env terlebih dulu — jest tidak memuat env otomatis seperti Nest
// ConfigModule saat runtime; test ini menyambung PrismaService langsung
// tanpa bootstrap AppModule, sehingga DATABASE_URL harus dimuat manual di sini.
import 'dotenv/config';
import { ServiceType, TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../slots/slots.service';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

/**
 * Integration test AC-F04-1 (versi end-to-end): "submit pada slot ter-hold/
 * terisi ditolak" — dua klien mengajukan POST /s/:slug/bookings (lewat
 * BookingService.createBooking langsung, tanpa HTTP) secara paralel pada
 * TANGGAL+JAM yang sama, kapasitas Availability=1. Membuktikan F04 benar-benar
 * memanggil SlotsService.reserveSlotOrThrow di dalam transaksi (bukan sekadar
 * mengklaim memanggilnya) — pola sama dengan slots.service.integration.spec.ts.
 *
 * Terhubung ke DB dev nyata (Neon via DATABASE_URL di .env) — BUKAN mock —
 * supaya pg_advisory_xact_lock benar-benar diuji lintas transaksi paralel.
 * Skip otomatis bila DATABASE_URL tidak tersedia (mis. CI tanpa akses DB).
 */
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb(
  'BookingService.createBooking — race condition (AC-F04-1, integrasi)',
  () => {
    let prisma: PrismaService;
    let bookingService: BookingService;
    let tenantId: string;
    let userId: string;
    let slug: string;

    // Tanggal jauh di masa depan supaya tidak bentrok dengan data nyata mana pun.
    const tanggalAcara = '2027-04-12';
    const hari = new Date(`${tanggalAcara}T00:00:00.000Z`).getUTCDay();

    beforeAll(async () => {
      prisma = new PrismaService();
      const slotsService = new SlotsService(prisma);
      bookingService = new BookingService(prisma, slotsService);
      await prisma.$connect();

      const suffix = `f04race${Date.now()}`;
      slug = suffix.slice(0, 30);

      const user = await prisma.user.create({
        data: { email: `${suffix}@test.local`, passwordHash: 'x' },
      });
      userId = user.id;

      const tenant = await prisma.tenant.create({
        data: {
          ownerUserId: user.id,
          slug,
          namaBisnis: 'Test F04 Race Condition',
          status: TenantStatus.ACTIVE,
        },
      });
      tenantId = tenant.id;

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

      await prisma.service.create({
        data: {
          tenantId,
          nama: 'Layanan Test Race F04',
          harga: 200_000,
          durasi: 60,
          tipe: ServiceType.MAKEUP,
          dpNilai: 30,
        },
      });
    }, 30_000);

    afterAll(async () => {
      // Urutan hapus sama seperti slots.service.integration.spec.ts: Booking
      // dulu (cascade BookingItem/CustomFieldValue) baru Tenant (cascade
      // sisanya incl. Client/Service) baru User — hindari FK constraint error.
      await prisma.booking.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });
      await prisma.user.delete({ where: { id: userId } });
      await prisma.$disconnect();
    }, 30_000);

    it('dua booking paralel pada slot kapasitas 1 -> tepat satu sukses', async () => {
      const service = await prisma.service.findFirstOrThrow({
        where: { tenantId },
        select: { id: true },
      });

      const makeDto = (phone: string): CreateBookingDto => ({
        serviceIds: [service.id],
        tanggalAcara,
        jamMulai: 540, // 09:00
        client: { nama: 'Klien Race F04', phone },
      });

      const results = await Promise.allSettled([
        bookingService.createBooking(slug, makeDto(`0811${Date.now()}1`)),
        bookingService.createBooking(slug, makeDto(`0811${Date.now()}2`)),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );

      // AC-F04-1: tepat satu sukses, satu gagal (409 slot penuh).
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
