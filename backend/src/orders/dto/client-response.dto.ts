import { BookingStatus } from '@prisma/client';

/** Response dasar Client (tenantId TIDAK disertakan) — dipakai GET/PUT single-resource. */
export class ClientResponseDto {
  id: string;
  nama: string;
  phone: string;
  email: string | null;
  catatan: string | null;
  totalBooking: number;
  createdAt: Date;
}

/** GET /clients — satu baris daftar klien. */
export class ClientListItemDto {
  id: string;
  nama: string;
  phone: string;
  email: string | null;
  totalBooking: number;
  createdAt: Date;
  /** Jumlah booking dengan status AWAITING_DP/CONFIRMED/PAID saat ini (bukan lifetime). */
  jumlahBookingAktif: number;
}

export class ClientListResponseDto {
  data: ClientListItemDto[];
  total: number;
  page: number;
  limit: number;
}

export class ClientBookingHistoryItemDto {
  id: string;
  kodeBooking: string;
  tanggalAcara: Date;
  statusBooking: BookingStatus;
  totalHarga: number;
}

/** GET /clients/:id — profil + riwayat booking (maks 50 terbaru, urut tanggalAcara desc). */
export class ClientDetailResponseDto extends ClientResponseDto {
  bookings: ClientBookingHistoryItemDto[];
}
