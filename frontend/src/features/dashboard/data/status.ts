import type { BookingStatus } from './types'

/** Urutan tampil status booking di seluruh dashboard (badge, tabel, donut). */
export const BOOKING_STATUS_ORDER: BookingStatus[] = [
  'AWAITING_DP',
  'CONFIRMED',
  'PAID',
  'COMPLETED',
  'CANCELED',
  'EXPIRED',
]

/** Kelas Tailwind untuk `<Badge>` per status — theme-aware (light/dark). */
export const BOOKING_STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  AWAITING_DP:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  CONFIRMED:
    'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  PAID: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  COMPLETED: 'border-transparent bg-primary/15 text-primary dark:bg-primary/25',
  CANCELED: 'border-transparent bg-destructive/15 text-destructive',
  EXPIRED: 'border-transparent bg-muted text-muted-foreground',
}

/**
 * Warna chart per status, dipetakan ke CSS variables tokens tema (bukan hex
 * hardcode) agar tetap terbaca di light & dark mode.
 */
export const BOOKING_STATUS_CHART_COLOR: Record<BookingStatus, string> = {
  AWAITING_DP: 'var(--chart-1)',
  CONFIRMED: 'var(--chart-2)',
  PAID: 'var(--chart-3)',
  COMPLETED: 'var(--chart-4)',
  CANCELED: 'var(--destructive)',
  EXPIRED: 'var(--muted-foreground)',
}
