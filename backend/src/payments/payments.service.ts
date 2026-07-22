import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { BookingTransitionsService } from '../orders/booking-transitions.service';
import { OrderDetailResponseDto } from '../orders/dto/order-response.dto';
import { BlobStorageService } from './blob-storage.service';
import { CreatePaymentUploadDto } from './dto/create-payment-upload.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { MarkCashPaymentDto } from './dto/mark-cash-payment.dto';
import { PaymentUploadResponseDto } from './dto/payment-response.dto';

/** Maks ukuran bukti transfer — 5MB (spesifikasi F06). */
export const MAX_BUKTI_FILE_SIZE_BYTES = 5 * 1024 * 1024;
/** Whitelist mime type bukti transfer — gambar umum + PDF. */
export const ALLOWED_BUKTI_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * PaymentsService — F06 Pembayaran Klien -> MUA (Manual, Non-Kustodi).
 *
 * RULE-1 MUTLAK: platform TIDAK PERNAH menahan/menyalurkan dana klien.
 * Service ini hanya (1) menerima & menyimpan BUKTI transfer (gambar/PDF, via
 * BlobStorageService), (2) mencatat status Payment berdasarkan konfirmasi
 * MUA, dan (3) memicu transisi status Booking yang berkorespondensi (lewat
 * BookingTransitionsService — SATU sumber logika, dipakai bersama dengan
 * OrdersService.confirm, F09). Tidak ada uang yang diproses di mana pun di
 * service ini.
 *
 * Audit trail: SENGAJA tidak memakai model AuditLog (didesain untuk aksi
 * admin F12, field adminEmail tidak cocok semantiknya). Karena Paket A
 * (1 user : 1 tenant), "siapa" trivial (pemilik tenant) — Payment.catatanMua
 * + confirmedAt + histori status SUDAH menjadi jejak audit yang memadai.
 *
 * Isolasi tenant: endpoint dashboard (confirm/reject/markCash) SELALU
 * scoped tenantId dari @CurrentTenant(). Endpoint publik (uploadBukti)
 * diverifikasi via kodeBooking + kecocokan nomor HP (pola sama dengan
 * BookingService.getBookingStatus, F04) — TANPA JWT.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blobStorage: BlobStorageService,
    private readonly bookingTransitions: BookingTransitionsService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * POST /bookings/:kode/payments (publik) — unggah bukti transfer.
   * Booking tidak ditemukan ATAU nomor HP tidak cocok -> 404 SERAGAM (bukan
   * 404 vs 403) — konsisten dengan pola privasi BookingService.getBookingStatus
   * (F04): kodeBooking saja tidak cukup untuk mengonfirmasi eksistensi
   * booking orang lain lewat perbedaan status code.
   */
  async uploadBukti(
    kode: string,
    dto: CreatePaymentUploadDto,
    file?: Express.Multer.File,
  ): Promise<PaymentUploadResponseDto> {
    this.assertValidBuktiFile(file);

    const booking = await this.prisma.booking.findUnique({
      where: { kodeBooking: kode },
      select: {
        id: true,
        tenantId: true,
        statusBooking: true,
        client: { select: { phone: true } },
      },
    });
    if (!booking || booking.client.phone !== dto.phone) {
      throw new NotFoundException('Booking tidak ditemukan.');
    }

    this.assertBookingStatusForTipe(
      dto.tipe,
      booking.statusBooking,
      'diunggah bukti pembayarannya',
    );

    const buktiFotoUrl = await this.blobStorage.uploadBuktiTransfer(
      booking.id,
      file,
    );

    const payment = await this.prisma.payment.create({
      data: {
        tenantId: booking.tenantId,
        bookingId: booking.id,
        tipe: dto.tipe,
        jumlah: dto.jumlah,
        status: PaymentStatus.SUBMITTED,
        buktiFotoUrl,
        catatanKlien: dto.catatanKlien ?? null,
      },
      select: {
        id: true,
        tipe: true,
        jumlah: true,
        status: true,
        buktiFotoUrl: true,
        createdAt: true,
      },
    });

    return {
      id: payment.id,
      tipe: payment.tipe,
      jumlah: Number(payment.jumlah),
      status: payment.status,
      buktiFotoUrl: payment.buktiFotoUrl,
      createdAt: payment.createdAt,
    };
  }

  /**
   * POST /orders/:id/payments/:paymentId/confirm (dashboard, tenant-scoped).
   * Payment.status harus SUBMITTED; transisi Booking dipilih dari
   * Payment.tipe. SATU `$transaction`: update Payment + transisi Booking
   * sukses bersama atau roll back bersama (mis. Payment berhasil diguard ke
   * CONFIRMED tapi Booking ternyata sudah bukan status asal yang diharapkan
   * -> seluruh transaksi batal, Payment TETAP SUBMITTED).
   */
  async confirmPayment(
    tenantId: string,
    bookingId: string,
    paymentId: string,
  ): Promise<OrderDetailResponseDto> {
    const payment = await this.findOwnedPaymentOrThrow(
      tenantId,
      bookingId,
      paymentId,
    );
    this.assertPaymentStatus(
      payment.status,
      PaymentStatus.SUBMITTED,
      'dikonfirmasi',
    );

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.payment.updateMany({
        where: { id: paymentId, tenantId, status: PaymentStatus.SUBMITTED },
        data: { status: PaymentStatus.CONFIRMED, confirmedAt: new Date() },
      });
      if (result.count === 0) {
        throw new ConflictException(
          'Pembayaran sudah diproses sebelum konfirmasi ini selesai.',
        );
      }

      await this.applyTransitionForTipe(
        tx,
        payment.tipe,
        tenantId,
        bookingId,
        payment.booking.clientId,
      );
    });

    return this.ordersService.detail(tenantId, bookingId);
  }

  /**
   * POST /orders/:id/payments/:paymentId/reject (dashboard, tenant-scoped).
   * Payment.status harus SUBMITTED. Booking status TIDAK berubah — klien
   * bisa unggah ulang selama hold/status masih valid (FR-F06-5).
   */
  async rejectPayment(
    tenantId: string,
    bookingId: string,
    paymentId: string,
    dto: RejectPaymentDto,
  ): Promise<OrderDetailResponseDto> {
    const payment = await this.findOwnedPaymentOrThrow(
      tenantId,
      bookingId,
      paymentId,
    );
    this.assertPaymentStatus(
      payment.status,
      PaymentStatus.SUBMITTED,
      'ditolak',
    );

    const result = await this.prisma.payment.updateMany({
      where: { id: paymentId, tenantId, status: PaymentStatus.SUBMITTED },
      data: { status: PaymentStatus.REJECTED, catatanMua: dto.alasan },
    });
    if (result.count === 0) {
      throw new ConflictException(
        'Pembayaran sudah diproses sebelum penolakan ini selesai.',
      );
    }

    return this.ordersService.detail(tenantId, bookingId);
  }

  /**
   * POST /orders/:id/payments/mark-cash (dashboard, tenant-scoped, FR-F06-7).
   * MUA mencatat pembayaran tunai TANPA bukti unggahan — Payment dibuat
   * langsung CONFIRMED, memicu transisi Booking yang sama seperti alur
   * unggah+konfirmasi. SATU `$transaction`: insert Payment + transisi
   * Booking sukses bersama atau roll back bersama (mis. race pada status
   * booking antara pre-check & transaksi).
   */
  async markCash(
    tenantId: string,
    bookingId: string,
    dto: MarkCashPaymentDto,
  ): Promise<OrderDetailResponseDto> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      select: { id: true, clientId: true, statusBooking: true },
    });
    if (!booking) {
      throw new NotFoundException('Order tidak ditemukan.');
    }
    this.assertBookingStatusForTipe(
      dto.tipe,
      booking.statusBooking,
      'ditandai tunai',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          tenantId,
          bookingId,
          tipe: dto.tipe,
          jumlah: dto.jumlah,
          status: PaymentStatus.CONFIRMED,
          catatanMua: dto.catatanMua ?? null,
          confirmedAt: new Date(),
        },
      });

      await this.applyTransitionForTipe(
        tx,
        dto.tipe,
        tenantId,
        bookingId,
        booking.clientId,
      );
    });

    return this.ordersService.detail(tenantId, bookingId);
  }

  /** Payment milik booking (URL :id) milik tenant — 404 seragam bila salah satu tidak cocok (hindari bocor eksistensi). */
  private async findOwnedPaymentOrThrow(
    tenantId: string,
    bookingId: string,
    paymentId: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId, bookingId },
      select: {
        id: true,
        tipe: true,
        status: true,
        booking: { select: { clientId: true } },
      },
    });
    if (!payment) {
      throw new NotFoundException('Pembayaran tidak ditemukan.');
    }
    return payment;
  }

  /** Dipanggil DI DALAM tx pemanggil — pilih transisi Booking sesuai tipe pembayaran. */
  private async applyTransitionForTipe(
    tx: Prisma.TransactionClient,
    tipe: string,
    tenantId: string,
    bookingId: string,
    clientId: string,
  ): Promise<void> {
    if (tipe === 'DP') {
      await this.bookingTransitions.confirmDpWithinTx(
        tx,
        tenantId,
        bookingId,
        clientId,
      );
    } else if (tipe === 'PELUNASAN') {
      await this.bookingTransitions.confirmPelunasanWithinTx(
        tx,
        tenantId,
        bookingId,
      );
    } else {
      // Defensif — DTO sudah membatasi 'DP'|'PELUNASAN' saat entry point,
      // seharusnya tidak pernah tercapai kecuali data lama/rusak.
      throw new ConflictException('Tipe pembayaran tidak dikenali.');
    }
  }

  /** Pre-check cepat (409) SEBELUM transaksi — guard definitif tetap di updateMany dalam tx (race-safe). */
  private assertPaymentStatus(
    current: PaymentStatus,
    required: PaymentStatus,
    actionLabel: string,
  ): void {
    if (current !== required) {
      throw new ConflictException(
        `Pembayaran berstatus ${current} tidak bisa ${actionLabel}.`,
      );
    }
  }

  /** Pre-check cepat (409) SEBELUM transaksi — guard definitif tetap di BookingTransitionsService (race-safe). */
  private assertBookingStatusForTipe(
    tipe: string,
    current: BookingStatus,
    actionLabel: string,
  ): void {
    const required =
      tipe === 'DP' ? BookingStatus.AWAITING_DP : BookingStatus.CONFIRMED;
    if (current !== required) {
      throw new ConflictException(
        `Booking berstatus ${current} tidak bisa ${actionLabel} (pembayaran tipe ${tipe} butuh status ${required}).`,
      );
    }
  }

  /** Validasi kehadiran + mime whitelist + ukuran maks bukti transfer (FR-F06-3). */
  private assertValidBuktiFile(
    file?: Express.Multer.File,
  ): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Bukti transfer wajib diunggah.');
    }
    if (!ALLOWED_BUKTI_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipe file tidak didukung (${file.mimetype}). Gunakan JPG, PNG, WEBP, atau PDF.`,
      );
    }
    if (file.size > MAX_BUKTI_FILE_SIZE_BYTES) {
      throw new BadRequestException('Ukuran file bukti maksimal 5MB.');
    }
  }
}
