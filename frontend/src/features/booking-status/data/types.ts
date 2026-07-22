// Kontrak `GET /api/bookings/:kode` (F04, FR-F04-7) — lihat
// backend/src/booking/dto/booking-response.dto.ts. REUSE `BookingItem` /
// `BookingPaymentProfile` dari storefront-public karena bentuknya identik
// (dipakai juga oleh response `POST /s/:slug/bookings`).
import type {
  BookingStatus,
  Payment,
} from '@/features/dashboard/data/types'
import type {
  BookingItem,
  BookingPaymentProfile,
} from '@/features/storefront-public/data/types'

export type { BookingItem, BookingPaymentProfile, Payment }

/**
 * Respons TANPA `?phone=` yang cocok — minimal by design (privasi, FR-F04-7):
 * tidak menyertakan nama klien/harga/lokasi.
 */
export interface BookingStatusMinimal {
  requiresOtp: true
  kodeBooking: string
  statusBooking: BookingStatus
  tanggalAcara: string // ISO datetime
}

/** Respons dengan `?phone=` yang cocok — detail penuh. */
export interface BookingStatusDetail {
  requiresOtp: false
  kodeBooking: string
  statusBooking: BookingStatus
  tanggalAcara: string // ISO datetime
  holdUntil: string | null // ISO datetime
  lokasiAcara: string | null
  catatan: string | null
  totalHarga: number
  dpAmount: number
  client: { nama: string; phone: string; email: string | null }
  items: BookingItem[]
  paymentProfile: BookingPaymentProfile | null
  /** Riwayat pembayaran, urut createdAt asc (F06) — HANYA muncul setelah phone match. */
  payments: Payment[]
}

export type BookingStatusResponse = BookingStatusMinimal | BookingStatusDetail
