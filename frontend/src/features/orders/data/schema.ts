import { z } from 'zod'
import { hhmmKeMenit } from '@/lib/time'

/**
 * DTO POST /orders/:id/cancel — `alasan` 5–500 karakter (sama persis dengan
 * batas backend/src/orders/dto/cancel-order.dto.ts) supaya validasi klien &
 * server konsisten (hindari roundtrip 400 yang seharusnya tercegah di form).
 */
export const cancelOrderFormSchema = z.object({
  alasan: z
    .string()
    .trim()
    .min(5, 'Alasan pembatalan minimal 5 karakter.')
    .max(500, 'Alasan pembatalan maksimal 500 karakter.'),
})

export type CancelOrderFormInput = z.input<typeof cancelOrderFormSchema>
export type CancelOrderFormValues = z.infer<typeof cancelOrderFormSchema>

/**
 * Format jam "HH:mm" untuk `jamMulai` — beda dengan `hhmmSchema` di
 * schedule/data/schema.ts (dipakai utk jamSelesai, boleh "24:00"/1440):
 * `RescheduleOrderDto.jamMulai` backend membatasi maks 1439 (23:59), jadi
 * "24:00" (1440 menit) HARUS ditolak di sini walau `hhmmKeMenit` menerimanya.
 */
const jamMulaiSchema = z.string().refine(
  (value) => {
    const menit = hhmmKeMenit(value)
    return menit !== null && menit <= 1439
  },
  { message: 'Format jam tidak valid (maksimal 23:59).' }
)

/**
 * DTO POST /orders/:id/reschedule. `tanggal` (Date, dari DatePicker) dikonversi
 * ke "YYYY-MM-DD" dan `jam` ("HH:mm") ke menit-sejak-00:00 sebelum dikirim —
 * lihat order-reschedule-dialog.tsx.
 *
 * `tanggal` opsional di level tipe (form mulai dari state "belum pilih
 * tanggal", sama seperti `blockedDateFormSchema` di schedule/data/schema.ts)
 * — kewajiban diisi ditegakkan lewat `superRefine`. Konsekuensinya
 * `RescheduleOrderFormValues.tanggal` tetap bertipe `Date | undefined`;
 * caller (order-reschedule-dialog.tsx) memakai `values.tanggal!` yang
 * dijamin ada setelah lolos validasi.
 */
export const rescheduleOrderFormSchema = z
  .object({
    tanggal: z.date().optional(),
    jam: jamMulaiSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.tanggal) {
      ctx.addIssue({
        code: 'custom',
        message: 'Tanggal wajib diisi.',
        path: ['tanggal'],
      })
    }
  })

export type RescheduleOrderFormInput = z.input<typeof rescheduleOrderFormSchema>
export type RescheduleOrderFormValues = z.infer<typeof rescheduleOrderFormSchema>

// ── Pembayaran (F06) ─────────────────────────────────────────────────────────

/**
 * DTO POST /orders/:id/payments/:paymentId/reject — `alasan` 5-500 karakter,
 * sama persis dengan batas backend (`backend/src/payments/dto/reject-payment.dto.ts`).
 */
export const rejectPaymentFormSchema = z.object({
  alasan: z
    .string()
    .trim()
    .min(5, 'Alasan tolak minimal 5 karakter.')
    .max(500, 'Alasan tolak maksimal 500 karakter.'),
})

export type RejectPaymentFormInput = z.input<typeof rejectPaymentFormSchema>
export type RejectPaymentFormValues = z.infer<typeof rejectPaymentFormSchema>

/**
 * DTO POST /orders/:id/payments/mark-cash — `jumlah` positif, `catatanMua`
 * opsional (maks 500 karakter), sama dengan
 * `backend/src/payments/dto/mark-cash-payment.dto.ts`. `tipe` TIDAK ada di
 * form (implisit dari `statusBooking` saat ini — lihat order-mark-cash-dialog.tsx).
 */
export const markCashPaymentFormSchema = z.object({
  jumlah: z.coerce
    .number({ error: 'Jumlah wajib diisi.' })
    .positive('Jumlah harus lebih besar dari 0.'),
  catatanMua: z
    .string()
    .trim()
    .max(500, 'Catatan maksimal 500 karakter.')
    .optional(),
})

export type MarkCashPaymentFormInput = z.input<typeof markCashPaymentFormSchema>
export type MarkCashPaymentFormValues = z.infer<typeof markCashPaymentFormSchema>
