/**
 * @file src/features/clients/data/types.ts
 * Kontrak `GET /clients`, `GET /clients/:id`, `PUT /clients/:id/notes` (F09)
 * — lihat `backend/src/orders/dto/client-response.dto.ts`. `BookingStatus`
 * di-REUSE dari dashboard (satu sumber kebenaran enum status booking di FE).
 */
import type { BookingStatus } from '@/features/dashboard/data/types'

export type { BookingStatus }

/** Satu baris `GET /clients`. */
export interface ClientListItem {
  id: string
  nama: string
  phone: string
  email: string | null
  totalBooking: number
  createdAt: string
  /** Jumlah booking AWAITING_DP/CONFIRMED/PAID saat ini (bukan lifetime). */
  jumlahBookingAktif: number
}

export interface ClientListResponse {
  data: ClientListItem[]
  total: number
  page: number
  limit: number
}

export interface ClientBookingHistoryItem {
  id: string
  kodeBooking: string
  tanggalAcara: string
  statusBooking: BookingStatus
  totalHarga: number
}

/** `GET /clients/:id` — profil + riwayat booking (maks 50, desc). */
export interface ClientDetail {
  id: string
  nama: string
  phone: string
  email: string | null
  catatan: string | null
  totalBooking: number
  createdAt: string
  bookings: ClientBookingHistoryItem[]
}

/** Respons dasar `PUT /clients/:id/notes` (tanpa `bookings`). */
export interface ClientResponse {
  id: string
  nama: string
  phone: string
  email: string | null
  catatan: string | null
  totalBooking: number
  createdAt: string
}

export interface ClientsListParams {
  q?: string
  page: number
  limit: number
}
