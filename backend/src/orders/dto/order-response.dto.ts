import { BookingStatus, PaymentStatus } from '@prisma/client';

/**
 * Response DTO F09 — dashboard order. tenantId TIDAK disertakan di mana pun
 * (konsisten dengan pola modul lain, mis. services/service-response.dto.ts).
 * Decimal Prisma (totalHarga/dpAmount/hargaSnapshot) dikonversi eksplisit ke number.
 */
export class OrderClientSummaryDto {
  id: string;
  nama: string;
  phone: string;
}

/** GET /orders — satu baris daftar order. */
export class OrderListItemDto {
  id: string;
  kodeBooking: string;
  tanggalAcara: Date;
  statusBooking: BookingStatus;
  totalHarga: number;
  dpAmount: number;
  holdUntil: Date | null;
  client: OrderClientSummaryDto;
  totalDurasiMenit: number;
  jumlahItem: number;
}

export class OrderListResponseDto {
  data: OrderListItemDto[];
  total: number;
  page: number;
  limit: number;
}

export class OrderItemDetailDto {
  namaSnapshot: string;
  qty: number;
  hargaSnapshot: number;
  durasi: number;
}

export class OrderCustomValueDto {
  customFieldId: string;
  /** Label CustomField saat ini (join, BUKAN snapshot) — label bisa berubah bila tenant mengedit CustomField. */
  label: string;
  nilai: string;
}

export class OrderClientDetailDto {
  id: string;
  nama: string;
  phone: string;
  email: string | null;
  catatan: string | null;
}

/** F06 — satu baris riwayat pembayaran (DP/pelunasan) milik booking. */
export class OrderPaymentDto {
  id: string;
  /** "DP" | "PELUNASAN" — string bukan enum Prisma, lihat catatan schema.prisma. */
  tipe: string;
  jumlah: number;
  status: PaymentStatus;
  /** null bila "tandai tunai" (FR-F06-7, tanpa bukti unggahan). */
  buktiFotoUrl: string | null;
  catatanKlien: string | null;
  /** Alasan tolak MUA, atau catatan tandai-tunai. */
  catatanMua: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
}

/**
 * GET /orders/:id — detail lengkap; juga response confirm/complete/cancel/
 * reschedule (F09) DAN payments/confirm|reject|mark-cash (F06) — satu bentuk
 * respons konsisten untuk semua aksi yang memutasi order.
 */
export class OrderDetailResponseDto {
  id: string;
  kodeBooking: string;
  tanggalAcara: Date;
  statusBooking: BookingStatus;
  totalHarga: number;
  dpAmount: number;
  holdUntil: Date | null;
  lokasiAcara: string | null;
  catatan: string | null;
  /** Diisi saat statusBooking -> CANCELED (F09, FR-F09-3); null selain itu. */
  alasanBatal: string | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: OrderClientDetailDto;
  items: OrderItemDetailDto[];
  customValues: OrderCustomValueDto[];
  /** Riwayat pembayaran, urut createdAt asc (F06). */
  payments: OrderPaymentDto[];
}
