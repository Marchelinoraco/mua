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
