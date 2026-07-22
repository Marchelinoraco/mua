/**
 * @file src/features/orders/data/types.ts
 * Kontrak `GET /orders`, `GET /orders/:id`, dan aksi status (F09) — lihat
 * `backend/src/orders/dto/order-response.dto.ts`. `BookingStatus` di-REUSE
 * dari dashboard (satu sumber kebenaran enum status booking di seluruh FE).
 */
import type {
  BookingStatus,
  Payment,
  PaymentStatus,
  PaymentTipe,
} from '@/features/dashboard/data/types'

export type { BookingStatus, Payment, PaymentStatus, PaymentTipe }

export interface OrderClientSummary {
  id: string
  nama: string
  phone: string
}

/** Satu baris `GET /orders`. */
export interface OrderListItem {
  id: string
  kodeBooking: string
  tanggalAcara: string // ISO datetime — konvensi naive UTC, lihat lib/naive-datetime.ts
  statusBooking: BookingStatus
  totalHarga: number
  dpAmount: number
  holdUntil: string | null // ISO datetime — instant UTC SUNGGUHAN (bukan naive)
  client: OrderClientSummary
  totalDurasiMenit: number
  jumlahItem: number
}

export interface OrderListResponse {
  data: OrderListItem[]
  total: number
  page: number
  limit: number
}

export interface OrderItemDetail {
  namaSnapshot: string
  qty: number
  hargaSnapshot: number
  durasi: number
}

export interface OrderCustomValue {
  customFieldId: string
  label: string
  nilai: string
}

export interface OrderClientDetail {
  id: string
  nama: string
  phone: string
  email: string | null
  catatan: string | null
}

/** `GET /orders/:id` — juga bentuk respons confirm/complete/cancel/reschedule. */
export interface OrderDetail {
  id: string
  kodeBooking: string
  tanggalAcara: string
  statusBooking: BookingStatus
  totalHarga: number
  dpAmount: number
  holdUntil: string | null
  lokasiAcara: string | null
  catatan: string | null
  alasanBatal: string | null
  canceledAt: string | null
  createdAt: string
  updatedAt: string
  client: OrderClientDetail
  items: OrderItemDetail[]
  customValues: OrderCustomValue[]
  /** Riwayat pembayaran, urut createdAt asc (F06). */
  payments: Payment[]
}

/** Parameter `GET /orders?status=&from=&to=&q=&page=&limit=`. */
export interface OrdersListParams {
  status?: BookingStatus[]
  from?: string
  to?: string
  q?: string
  page: number
  limit: number
}
