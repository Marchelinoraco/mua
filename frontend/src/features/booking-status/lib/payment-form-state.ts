import type {
  BookingStatus,
  Payment,
  PaymentTipe,
} from '@/features/dashboard/data/types'

export type PaymentFormState =
  | { visible: false }
  | {
      visible: true
      tipe: PaymentTipe
      suggestedAmount: number
      /** `true` bila pembayaran tipe ini pernah REJECTED — form ditampilkan sebagai "unggah ulang". */
      isReupload: boolean
    }

/**
 * Tentukan apakah form unggah bukti pembayaran (F06, Bagian 2) harus tampil
 * di halaman status booking, dan untuk tipe apa (DP/pelunasan):
 * - `AWAITING_DP` + belum ada Payment DP SUBMITTED/CONFIRMED -> form DP.
 * - `CONFIRMED` + belum ada Payment PELUNASAN SUBMITTED/CONFIRMED -> form pelunasan.
 * - Status lain (PAID/COMPLETED/CANCELED/EXPIRED) -> form tidak tampil.
 * - Bila pembayaran tipe terkait REJECTED (dan tidak ada SUBMITTED/CONFIRMED
 *   susulan) -> form tetap tampil, ditandai `isReupload: true` (FR-F06-5).
 */
export function resolvePaymentFormState(
  statusBooking: BookingStatus,
  totalHarga: number,
  dpAmount: number,
  payments: Payment[]
): PaymentFormState {
  const tipe: PaymentTipe | null =
    statusBooking === 'AWAITING_DP'
      ? 'DP'
      : statusBooking === 'CONFIRMED'
        ? 'PELUNASAN'
        : null
  if (!tipe) return { visible: false }

  const relevant = payments.filter((p) => p.tipe === tipe)
  const hasActive = relevant.some(
    (p) => p.status === 'SUBMITTED' || p.status === 'CONFIRMED'
  )
  if (hasActive) return { visible: false }

  const isReupload = relevant.some((p) => p.status === 'REJECTED')
  const suggestedAmount = tipe === 'DP' ? dpAmount : totalHarga - dpAmount

  return { visible: true, tipe, suggestedAmount, isReupload }
}
