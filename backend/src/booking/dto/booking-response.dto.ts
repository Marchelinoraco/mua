import { BookingStatus, PaymentStatus } from '@prisma/client';

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

/** F06 — satu baris riwayat pembayaran (DP/pelunasan), tampil hanya saat phone cocok. */
export class BookingPaymentResponseDto {
  id: string;
  /** "DP" | "PELUNASAN" — string bukan enum Prisma, lihat catatan schema.prisma. */
  tipe: string;
  jumlah: number;
  status: PaymentStatus;
  /** null bila "tandai tunai" (FR-F06-7, tanpa bukti unggahan). */
  buktiFotoUrl: string | null;
  catatanKlien: string | null;
  catatanMua: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
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
  /** Riwayat pembayaran, urut createdAt asc (F06) — HANYA muncul setelah phone match. */
  payments: BookingPaymentResponseDto[];
}

export type BookingStatusResponseDto =
  BookingStatusMinimalResponseDto | BookingStatusDetailResponseDto;
