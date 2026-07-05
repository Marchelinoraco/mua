import type { DashboardStats } from './types'

/**
 * Data dummy dashboard — deterministik (bukan `Math.random()`) agar snapshot
 * test & tampilan stabil antar-render. Bernuansa bisnis MUA Indonesia.
 *
 * TODO: hapus file ini setelah `GET /dashboard/stats` tersedia (pasca F02–F04);
 * lihat `hooks/use-dashboard-stats.ts`.
 */
export const mockDashboardStats: DashboardStats = {
  revenue: { total: 23_450_000, deltaPct: 18.4 },
  bookings: { total: 32, deltaPct: 38.1 },
  clients: { total: 51, deltaPct: 12.5 },
  quota: { used: 24, limit: 50 },

  weeklyRevenue: [
    { week: '11 Mei', total: 2_150_000 },
    { week: '18 Mei', total: 2_780_000 },
    { week: '25 Mei', total: 3_120_000 },
    { week: '01 Jun', total: 3_640_000 },
    { week: '08 Jun', total: 4_050_000 },
    { week: '15 Jun', total: 3_480_000 },
    { week: '22 Jun', total: 4_320_000 },
    { week: '29 Jun', total: 3_950_000 },
  ],

  // Total harus sinkron dengan `bookings.total` (32).
  statusBreakdown: {
    AWAITING_DP: 4,
    CONFIRMED: 9,
    PAID: 6,
    COMPLETED: 11,
    CANCELED: 1,
    EXPIRED: 1,
  },

  recentBookings: [
    {
      id: 'bk-0032',
      kode: 'GB-20260703-0032',
      clientName: 'Amanda Putri',
      serviceName: 'Makeup Wedding',
      tanggal: '2026-07-03',
      dpAmount: 1_500_000,
      status: 'PAID',
    },
    {
      id: 'bk-0031',
      kode: 'GB-20260701-0031',
      clientName: 'Siti Nurhaliza',
      serviceName: 'Makeup Wisuda',
      tanggal: '2026-07-01',
      dpAmount: 500_000,
      status: 'CONFIRMED',
    },
    {
      id: 'bk-0030',
      kode: 'GB-20260629-0030',
      clientName: 'Dewi Lestari',
      serviceName: 'Makeup Party',
      tanggal: '2026-06-29',
      dpAmount: 350_000,
      status: 'COMPLETED',
    },
    {
      id: 'bk-0029',
      kode: 'GB-20260628-0029',
      clientName: 'Rina Marlina',
      serviceName: 'Makeup Wedding',
      tanggal: '2026-06-28',
      dpAmount: 3_500_000,
      status: 'COMPLETED',
    },
    {
      id: 'bk-0028',
      kode: 'GB-20260627-0028',
      clientName: 'Fitriani Azzahra',
      serviceName: 'Makeup Prewedding',
      tanggal: '2026-06-27',
      dpAmount: 1_200_000,
      status: 'AWAITING_DP',
    },
    {
      id: 'bk-0027',
      kode: 'GB-20260625-0027',
      clientName: 'Yulia Ningsih',
      serviceName: 'Makeup Wisuda',
      tanggal: '2026-06-25',
      dpAmount: 400_000,
      status: 'CANCELED',
    },
  ],

  upcomingBookings: [
    {
      id: 'up-1',
      clientName: 'Nadia Kusuma',
      serviceName: 'Makeup Wedding',
      tanggal: '2026-07-06',
      jamMulai: '06:00',
      lokasi: 'Gedung Serbaguna, Kelapa Gading, Jakarta Utara',
    },
    {
      id: 'up-2',
      clientName: 'Bunga Citra',
      serviceName: 'Makeup Wisuda',
      tanggal: '2026-07-08',
      jamMulai: '07:30',
      lokasi: 'Rumah Klien, Bintaro, Tangerang Selatan',
    },
    {
      id: 'up-3',
      clientName: 'Ayu Ratna',
      serviceName: 'Makeup Party',
      tanggal: '2026-07-10',
      jamMulai: '16:00',
      lokasi: 'Studio GlowBook, Kemang, Jakarta Selatan',
    },
    {
      id: 'up-4',
      clientName: 'Putri Wulandari',
      serviceName: 'Makeup Prewedding',
      tanggal: '2026-07-12',
      jamMulai: '09:00',
      lokasi: 'Pantai Ancol, Jakarta Utara',
    },
  ],

  popularServices: [
    { id: 'svc-wedding', name: 'Makeup Wedding', bookingCount: 14 },
    { id: 'svc-wisuda', name: 'Makeup Wisuda', bookingCount: 9 },
    { id: 'svc-party', name: 'Makeup Party', bookingCount: 6 },
    { id: 'svc-prewedding', name: 'Makeup Prewedding', bookingCount: 3 },
  ],
}
