/**
 * @file src/features/dashboard/data/types.ts
 * Kontrak data untuk dashboard MUA — mencerminkan bentuk respons future
 * `GET /dashboard/stats` (lihat use-dashboard-stats.ts). Sengaja dipisah dari
 * mock agar backend bisa memakai file ini sebagai acuan DTO.
 *
 * `BookingStatus` mengikuti enum UPPERCASE_ENGLISH pada docs/data-model.md —
 * jangan diubah tanpa koordinasi dengan backend-engineer.
 */

export type BookingStatus =
  | 'AWAITING_DP'
  | 'CONFIRMED'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELED'
  | 'EXPIRED'

/** Metrik dengan perbandingan ke periode sebelumnya (mis. bulan lalu). */
export interface DashboardStatMetric {
  total: number
  /** Perubahan persentase vs periode sebelumnya. Negatif = turun. */
  deltaPct: number
}

export interface DashboardQuota {
  used: number
  limit: number
}

export interface WeeklyRevenuePoint {
  /** Label minggu untuk sumbu-X chart, mis. "01 Jun". */
  week: string
  total: number
}

export interface RecentBooking {
  id: string
  kode: string
  clientName: string
  serviceName: string
  /** ISO date (yyyy-MM-dd). */
  tanggal: string
  dpAmount: number
  status: BookingStatus
}

export interface UpcomingBooking {
  id: string
  clientName: string
  serviceName: string
  /** ISO date (yyyy-MM-dd). */
  tanggal: string
  /** Jam mulai, format 24 jam "HH:mm". */
  jamMulai: string
  lokasi: string
}

export interface PopularService {
  id: string
  name: string
  bookingCount: number
}

/** Kontrak lengkap respons `GET /dashboard/stats`. */
export interface DashboardStats {
  revenue: DashboardStatMetric
  bookings: DashboardStatMetric
  clients: DashboardStatMetric
  quota: DashboardQuota
  weeklyRevenue: WeeklyRevenuePoint[]
  statusBreakdown: Record<BookingStatus, number>
  recentBookings: RecentBooking[]
  upcomingBookings: UpcomingBooking[]
  popularServices: PopularService[]
}
