import { z } from 'zod'
import type { StorefrontCustomField } from './types'

// ── Form "Laporkan halaman ini" ──────────────────────────────────────────────
// Kontrak backend: POST /api/s/:slug/report { alasan (10-1000), kontak? (max 200) }

export const reportFormSchema = z.object({
  alasan: z
    .string()
    .trim()
    .min(10, 'Alasan minimal 10 karakter.')
    .max(1000, 'Alasan maksimal 1000 karakter.'),
  kontak: z
    .string()
    .trim()
    .max(200, 'Kontak maksimal 200 karakter.')
    .optional()
    .or(z.literal('')),
})

export type ReportFormInput = z.input<typeof reportFormSchema>
export type ReportFormValues = z.infer<typeof reportFormSchema>

// ── Form Booking Mandiri (F04) — step 3 "Data Diri" ─────────────────────────
// Pola nomor WA SENGAJA disamakan persis dengan backend
// (`backend/src/booking/dto/create-booking.dto.ts` PHONE_PATTERN) supaya
// pesan validasi FE & BE konsisten dan tidak ada kasus lolos FE tapi ditolak BE.
const BOOKING_PHONE_PATTERN = /^\+?[0-9]{8,20}$/

export const bookingDetailsFormSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter.')
    .max(100, 'Nama maksimal 100 karakter.'),
  phone: z
    .string()
    .trim()
    .regex(
      BOOKING_PHONE_PATTERN,
      'Nomor WA tidak valid (hanya angka, 8-20 digit, boleh diawali +).'
    ),
  email: z
    .string()
    .trim()
    .email('Format email tidak valid.')
    .optional()
    .or(z.literal('')),
  lokasiAcara: z
    .string()
    .trim()
    .max(300, 'Lokasi maksimal 300 karakter.')
    .optional()
    .or(z.literal('')),
  catatan: z
    .string()
    .trim()
    .max(1000, 'Catatan maksimal 1000 karakter.')
    .optional()
    .or(z.literal('')),
})

// ── Custom field dinamis (F03 → F04) ────────────────────────────────────────
// `GET /api/s/:slug` (varian ACTIVE) sekarang menyertakan `customFields` aktif
// tenant. Setiap jawaban klien disimpan di form sbg
// `customValues[customFieldId]: string` (semua tipe dikirim sbg string ke BE,
// termasuk checkbox "true"/"false" dan date "YYYY-MM-DD" — lihat
// `CustomFieldValue.nilai` di backend). Skema per-field dibangun dinamis di
// sini karena daftar field berbeda per tenant dan tidak diketahui saat compile
// time.

/**
 * Field bertipe `file` SENGAJA TIDAK PERNAH divalidasi wajib di sini walau
 * `wajib=true` dari API — upload sungguhan belum ada endpoint-nya di MVP ini
 * (lihat komentar keterbatasan di `storefront-booking-step-details.tsx`).
 * Field ini selalu dirender disabled & tidak pernah dikirim ke backend.
 * KETERBATASAN YANG DIKETAHUI: bila tenant kebetulan membuat custom field
 * wajib bertipe `file`, submit booking via storefront publik akan selalu
 * ditolak backend (400) — di luar cakupan MVP ini.
 */
export function buildCustomValuesSchema(customFields: StorefrontCustomField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of customFields) {
    if (field.tipe === 'file') {
      shape[field.id] = z.string().optional()
      continue
    }
    if (field.tipe === 'checkbox') {
      shape[field.id] = field.wajib
        ? z.string().refine((v) => v === 'true', 'Wajib dicentang.')
        : z.string().optional()
      continue
    }
    // text | select | date
    shape[field.id] = field.wajib
      ? z.string().trim().min(1, 'Wajib diisi.')
      : z.string().trim().optional()
  }
  return z.object(shape)
}

/** Skema step 3 lengkap = field statis + `customValues` dinamis per tenant. */
export function buildBookingDetailsFormSchema(
  customFields: StorefrontCustomField[] = []
) {
  return bookingDetailsFormSchema.extend({
    customValues: buildCustomValuesSchema(customFields),
  })
}

/** Nilai default awal RHF untuk tiap custom field (checkbox: 'false', lainnya: ''). */
export function buildDefaultCustomValues(
  customFields: StorefrontCustomField[]
): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const field of customFields) {
    defaults[field.id] = field.tipe === 'checkbox' ? 'false' : ''
  }
  return defaults
}

// `customValues` selalu di-set (minimal `{}`) lewat `defaultValues` di
// `storefront-booking-dialog.tsx` (via `buildDefaultCustomValues`), jadi
// SENGAJA non-optional di kedua tipe berikut — bukan hanya di tipe output.
export type BookingDetailsFormInput = z.input<
  typeof bookingDetailsFormSchema
> & {
  customValues: Record<string, string>
}
export type BookingDetailsFormValues = z.infer<
  typeof bookingDetailsFormSchema
> & {
  customValues: Record<string, string>
}
