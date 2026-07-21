import { BookingStatus } from '@prisma/client';

/**
 * Response DTO F04 — booking publik. JANGAN PERNAH menambah field yang
 * membocorkan data lintas-tenant (ownerUserId, dsb) — konsisten dengan
 * storefront-profile-response.dto.ts (F02).
 */
export class BookingItemResponseDto {
  namaSnapshot: string;
  qty: number;
  hargaSnapshot: number;
  durasi: number;
}

export class BookingPaymentProfileResponseDto {
  namaBank: string;
  nomorRekening: string;
  namaPemilik: string;
  instruksiTambahan: string | null;
}

/** Response 201 POST /s/:slug/bookings (FR-F04-6 — instruksi pembayaran langsung). */
export class CreateBookingResponseDto {
  kodeBooking: string;
  statusBooking: BookingStatus;
  tanggalAcara: Date;
  holdUntil: Date;
  totalHarga: number;
  dpAmount: number;
  /** null bila MUA belum mengisi PaymentProfile — FE wajib menangani. */
  paymentProfile: BookingPaymentProfileResponseDto | null;
  items: BookingItemResponseDto[];
}

/**
 * Response GET /bookings/:kode TANPA `?phone=` yang cocok (atau tidak dikirim).
 * Minimal by design (FR-F04-7) — TIDAK menyertakan nama klien/harga/lokasi
 * supaya kodeBooking saja tidak cukup untuk mengintip data orang lain.
 */
export class BookingStatusMinimalResponseDto {
  requiresOtp: true;
  kodeBooking: string;
  statusBooking: BookingStatus;
  tanggalAcara: Date;
}

/**
 * Response GET /bookings/:kode dengan `?phone=` yang cocok dengan
 * booking.client.phone — workaround sementara (lihat TODO F08 di
 * booking.service.ts). Detail penuh, setara payload pembuatan booking.
 */
export class BookingStatusDetailResponseDto {
  requiresOtp: false;
  kodeBooking: string;
  statusBooking: BookingStatus;
  tanggalAcara: Date;
  holdUntil: Date | null;
  lokasiAcara: string | null;
  catatan: string | null;
  totalHarga: number;
  dpAmount: number;
  client: { nama: string; phone: string; email: string | null };
  items: BookingItemResponseDto[];
  paymentProfile: BookingPaymentProfileResponseDto | null;
}

export type BookingStatusResponseDto =
  | BookingStatusMinimalResponseDto
  | BookingStatusDetailResponseDto;
