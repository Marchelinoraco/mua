import { z } from 'zod'

// ── PaymentProfile ──────────────────────────────────────────────────────────

export const paymentProfileSchema = z.object({
  namaBank: z.string().min(1, 'Nama bank wajib diisi.'),
  nomorRekening: z.string().min(1, 'Nomor rekening wajib diisi.'),
  namaPemilik: z.string().min(1, 'Nama pemilik rekening wajib diisi.'),
  instruksiTambahan: z.string().optional(),
})

export type PaymentProfileFormValues = z.infer<typeof paymentProfileSchema>

// ── Onboarding Checklist ────────────────────────────────────────────────────

export const onboardingChecklistSchema = z.object({
  hasPaymentProfile: z.boolean(),
  hasService: z.boolean(),
  hasAvailability: z.boolean(),
  isReady: z.boolean(),
})

export type OnboardingChecklist = z.infer<typeof onboardingChecklistSchema>
