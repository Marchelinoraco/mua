/**
 * @file src/features/orders/data/data.ts
 * Daftar nilai `BookingStatus` untuk facet filter tabel order & validasi
 * search-schema route. Urutan tampil mengikuti `BOOKING_STATUS_ORDER`
 * (dashboard/data/status.ts) — satu sumber kebenaran urutan status di FE.
 */
import { BOOKING_STATUS_ORDER } from '@/features/dashboard/data/status'
import type { BookingStatus } from '@/features/dashboard/data/types'

/** Tuple literal (bukan `BookingStatus[]`) — dibutuhkan `z.enum` di route search-schema. */
export const ORDER_STATUS_VALUES = [
  'AWAITING_DP',
  'CONFIRMED',
  'PAID',
  'COMPLETED',
  'CANCELED',
  'EXPIRED',
] as const satisfies readonly BookingStatus[]

export const ORDER_STATUS_OPTIONS: { label: BookingStatus; value: BookingStatus }[] =
  BOOKING_STATUS_ORDER.map((status) => ({ label: status, value: status }))
