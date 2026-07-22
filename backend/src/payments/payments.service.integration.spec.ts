// Muat .env terlebih dulu — jest tidak memuat env otomatis seperti Nest
// ConfigModule saat runtime; test ini menyambung PrismaService langsung
// tanpa bootstrap AppModule, sehingga DATABASE_URL harus dimuat manual di sini.
import 'dotenv/config';
import { ConflictException } from '@nestjs/common';
import { BookingStatus, PaymentStatus, TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../slots/slots.service';
import { OrdersService } from '../orders/orders.service';
import { BookingTransitionsService } from '../orders/booking-transitions.service';
import { PaymentsService } from './payments.service';
import { BlobStorageService } from './blob-storage.service';

/**
 * Integration test F06 — transisi status Booking yang dipicu konfirmasi
 * pembayaran BENAR-BENAR tersimpan di Neon dev (bukan mock), termasuk guard
 * atomik race condition (dua konfirmasi DP bersamaan untuk booking yang sama
 * -> HARUS tepat satu sukses, TIDAK BOLEH double-increment Client.totalBooking
 * — lihat brief F06 §keputusan-3). Pola sama dengan
 * booking.service.integration.spec.ts / slots.service.integration.spec.ts.
 *
 * BlobStorageService di-mock (BUKAN real @vercel/blob) — BLOB_READ_WRITE_TOKEN
 * belum tentu tersedia di .env lokal, dan tes ini tidak menyentuh uploadBukti
 * (fokus ke transisi Booking via markCash/confirmPayment/rejectPayment, yang
 * semuanya tidak butuh Blob). Skip otomatis bila DATABASE_URL tidak tersedia.
 */
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb(
  'PaymentsService — transisi Booking tersimpan di DB (F06, integrasi)',
  () => {
    let prisma: PrismaService;
    let paymentsService: PaymentsService;
    let ordersService: OrdersService;
    let tenantId: string;
    let userId: string;

    beforeAll(async () => {
      prisma = new PrismaService();
      await prisma.$connect();

      const slotsService = new SlotsService(prisma);
      const bookingTransitions = new BookingTransitionsService();
      ordersService = new OrdersService(
        prisma,
        slotsService,
        bookingTransitions,
      );
      const blobStorage = {
        uploadBuktiTransfer: jest.fn(),
      } as unknown as BlobStorageService;
      paymentsService = new PaymentsService(
        prisma,
        blobStorage,
        bookingTransitions,
        ordersService,
      );

      const suffix = `f06pay${Date.now()}`;
      const user = await prisma.user.create({
        data: { email: `${suffix}@test.local`, passwordHash: 'x' },
      });
      userId = user.id;

      const tenant = await prisma.tenant.create({
        data: {
          ownerUserId: user.id,
          slug: suffix.slice(0, 30),
          namaBisnis: 'Test F06 Payments',
          status: TenantStatus.ACTIVE,
        },
      });
      tenantId = tenant.id;
    }, 30_000);

    afterAll(async () => {
      await prisma.booking.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });
      await prisma.user.delete({ where: { id: userId } });
      await prisma.$disconnect();
    }, 30_000);

    /** Buat Client + Booking(AWAITING_DP) baru, isolasi per test lewat kodeBooking unik. */
    async function createAwaitingDpBooking(label: string) {
      const client = await prisma.client.create({
        data: {
          tenantId,
          nama: `Klien ${label}`,
          phone: `0811${Date.now()}${Math.floor(Math.random() * 1000)}`,
        },
      });
      const booking = await prisma.booking.create({
        data: {
          tenantId,
          clientId: client.id,
          kodeBooking: `GB-TEST-${label}-${Date.now()}`,
          tanggalAcara: new Date('2027-05-01T09:00:00.000Z'),
          totalHarga: 1_000_000,
          dpAmount: 300_000,
          holdUntil: new Date(Date.now() + 120 * 60 * 1000),
          statusBooking: BookingStatus.AWAITING_DP,
        },
      });
      return { client, booking };
    }

    it('markCash DP -> Booking CONFIRMED, holdUntil null, totalBooking +1, Payment CONFIRMED tanpa buktiFotoUrl', async () => {
      const { client, booking } = await createAwaitingDpBooking('cashdp');

      const result = await paymentsService.markCash(tenantId, booking.id, {
        tipe: 'DP',
        jumlah: 300_000,
      });

      expect(result.statusBooking).toBe(BookingStatus.CONFIRMED);
      expect(result.holdUntil).toBeNull();
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0]).toMatchObject({
        tipe: 'DP',
        status: PaymentStatus.CONFIRMED,
        buktiFotoUrl: null,
      });

      const clientAfter = await prisma.client.findUniqueOrThrow({
        where: { id: client.id },
      });
      expect(clientAfter.totalBooking).toBe(1);

      // Lanjut: markCash PELUNASAN pada booking yang sama -> PAID.
      const pelunasanResult = await paymentsService.markCash(
        tenantId,
        booking.id,
        {
          tipe: 'PELUNASAN',
          jumlah: 700_000,
          catatanMua: 'Lunas tunai di venue.',
        },
      );
      expect(pelunasanResult.statusBooking).toBe(BookingStatus.PAID);
      expect(pelunasanResult.payments).toHaveLength(2);

      // totalBooking TIDAK bertambah lagi saat pelunasan (hanya di-increment saat DP).
      const clientAfterPelunasan = await prisma.client.findUniqueOrThrow({
        where: { id: client.id },
      });
      expect(clientAfterPelunasan.totalBooking).toBe(1);
    }, 30_000);

    it('confirmPayment: dua Payment(DP,SUBMITTED) untuk booking yang sama dikonfirmasi bersamaan -> tepat satu sukses, TIDAK double-increment', async () => {
      const { client, booking } = await createAwaitingDpBooking('racedp');

      const [paymentA, paymentB] = await Promise.all([
        prisma.payment.create({
          data: {
            tenantId,
            bookingId: booking.id,
            tipe: 'DP',
            jumlah: 300_000,
            status: PaymentStatus.SUBMITTED,
            buktiFotoUrl: 'https://blob.example/a.jpg',
          },
        }),
        prisma.payment.create({
          data: {
            tenantId,
            bookingId: booking.id,
            tipe: 'DP',
            jumlah: 300_000,
            status: PaymentStatus.SUBMITTED,
            buktiFotoUrl: 'https://blob.example/b.jpg',
          },
        }),
      ]);

      const results = await Promise.allSettled([
        paymentsService.confirmPayment(tenantId, booking.id, paymentA.id),
        paymentsService.confirmPayment(tenantId, booking.id, paymentB.id),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);

      const bookingAfter = await prisma.booking.findUniqueOrThrow({
        where: { id: booking.id },
      });
      expect(bookingAfter.statusBooking).toBe(BookingStatus.CONFIRMED);

      // Guard atomik BookingTransitionsService WAJIB mencegah double-increment.
      const clientAfter = await prisma.client.findUniqueOrThrow({
        where: { id: client.id },
      });
      expect(clientAfter.totalBooking).toBe(1);

      // Payment yang kalah race TETAP SUBMITTED (transaksinya roll back utuh).
      const payments = await prisma.payment.findMany({
        where: { bookingId: booking.id },
        orderBy: { createdAt: 'asc' },
      });
      const statuses = payments.map((p) => p.status).sort();
      expect(statuses).toEqual(
        [PaymentStatus.CONFIRMED, PaymentStatus.SUBMITTED].sort(),
      );
    }, 30_000);

    it('rejectPayment: Payment->REJECTED + catatanMua, Booking status TIDAK berubah', async () => {
      const { booking } = await createAwaitingDpBooking('reject');
      const payment = await prisma.payment.create({
        data: {
          tenantId,
          bookingId: booking.id,
          tipe: 'DP',
          jumlah: 300_000,
          status: PaymentStatus.SUBMITTED,
          buktiFotoUrl: 'https://blob.example/c.jpg',
        },
      });

      const result = await paymentsService.rejectPayment(
        tenantId,
        booking.id,
        payment.id,
        { alasan: 'Nominal tidak sesuai, mohon transfer ulang.' },
      );

      expect(result.statusBooking).toBe(BookingStatus.AWAITING_DP);
      const rejected = result.payments.find((p) => p.id === payment.id);
      expect(rejected).toMatchObject({
        status: PaymentStatus.REJECTED,
        catatanMua: 'Nominal tidak sesuai, mohon transfer ulang.',
      });
    }, 30_000);
  },
);
