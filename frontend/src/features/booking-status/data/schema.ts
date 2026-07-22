import { z } from 'zod'

// ── Form verifikasi ringan nomor WA — halaman status booking (F04) ─────────
// Kontrak backend: GET /api/bookings/:kode?phone=... — pola nomor disamakan
// dengan `backend/src/booking/dto/create-booking.dto.ts` PHONE_PATTERN.
// CATATAN: ini BUKAN OTP asli (POST /bookings/:kode/verify-otp selalu 501
// sampai F08/WhatsApp Business API siap) — cuma pencocokan nomor telepon.
const PHONE_PATTERN = /^\+?[0-9]{8,20}$/

export const verifyPhoneFormSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      PHONE_PATTERN,
      'Nomor WA tidak valid (hanya angka, 8-20 digit, boleh diawali +).'
    ),
})

export type VerifyPhoneFormInput = z.input<typeof verifyPhoneFormSchema>
export type VerifyPhoneFormValues = z.infer<typeof verifyPhoneFormSchema>

// ── Form unggah bukti pembayaran (F06) ──────────────────────────────────────
// Kontrak backend: POST /api/bookings/:kode/payments (multipart/form-data) —
// lihat backend/src/payments/dto/create-payment-upload.dto.ts &
// PaymentsService (MAX_BUKTI_FILE_SIZE_BYTES / ALLOWED_BUKTI_MIME_TYPES).
// Validasi ukuran/mime di sini adalah cek client-side (UX cepat sebelum
// upload) — validasi definitif tetap di server.

/** 5MB — sama persis dengan batas bisnis backend (bukan limit multer, yang sedikit lebih longgar sbg jaring pengaman memori). */
export const MAX_BUKTI_FILE_SIZE_BYTES = 5 * 1024 * 1024

/** Sama persis dengan whitelist backend `ALLOWED_BUKTI_MIME_TYPES`. */
export const ALLOWED_BUKTI_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export const paymentUploadFormSchema = z.object({
  jumlah: z.coerce
    .number({ error: 'Jumlah wajib diisi.' })
    .positive('Jumlah harus lebih besar dari 0.'),
  catatanKlien: z
    .string()
    .trim()
    .max(500, 'Catatan maksimal 500 karakter.')
    .optional(),
  bukti: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, {
      message: 'Bukti transfer wajib diunggah.',
    })
    .refine(
      (files) =>
        files.length === 0 ||
        ALLOWED_BUKTI_MIME_TYPES.includes(files[0].type),
      { message: 'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.' }
    )
    .refine(
      (files) => files.length === 0 || files[0].size <= MAX_BUKTI_FILE_SIZE_BYTES,
      { message: 'Ukuran file bukti maksimal 5MB.' }
    ),
})

export type PaymentUploadFormInput = z.input<typeof paymentUploadFormSchema>
export type PaymentUploadFormValues = z.infer<typeof paymentUploadFormSchema>
