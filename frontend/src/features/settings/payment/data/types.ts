/**
 * @file src/features/settings/payment/data/types.ts
 * Kontrak `GET/PUT /payment-profile` — lihat
 * `backend/src/payment-profile/dto/payment-profile-response.dto.ts`. Zod
 * schema & tipe form (`paymentProfileSchema`/`PaymentProfileFormValues`)
 * DI-REUSE dari `features/onboarding/data/schema.ts` (form step 2 onboarding
 * memakai field yang identik) — jangan duplikasi di sini.
 */

/** Respons `GET /payment-profile` — instruksi rekening MUA (RULE-1: tidak ada data dana/transaksi). */
export interface PaymentProfile {
  id: string
  namaBank: string
  nomorRekening: string
  namaPemilik: string
  instruksiTambahan: string | null
  updatedAt: string
}
