// Tipe domain F05 — Jam Kerja (Availability), Tanggal Diblokir & Kalender.
// Kontrak persis dari backend-engineer (lihat docs/features/F05-kalender-anti-bentrok.md).
import type { BookingStatus } from '@/features/dashboard/data/types'

/** 0 = Minggu ... 6 = Sabtu (mengikuti konvensi `Date#getDay()`). */
export type HariIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Availability {
  id: string
  hari: HariIndex
  jamMulai: number // menit sejak 00:00
  jamSelesai: number // menit sejak 00:00
  slotDurasi: number // menit
  kapasitas: number
  createdAt: string
  updatedAt: string
}

export interface BlockedDate {
  id: string
  tanggalMulai: string
  tanggalSelesai: string
  alasan: string | null
  createdAt: string
}

export interface CalendarBooking {
  id: string
  kodeBooking: string
  tanggalAcara: string
  statusBooking: BookingStatus
  clientNama: string
  totalDurasiMenit: number
}

export interface CalendarDay {
  date: string // YYYY-MM-DD
  blocked: boolean
  blockedReason: string | null
  bookings: CalendarBooking[]
}

export interface CalendarResponse {
  from: string
  to: string
  availability: Availability[]
  days: CalendarDay[]
}
