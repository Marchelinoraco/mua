import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import type { PaymentProfileFormValues } from '@/features/onboarding/data/schema'
import type { PaymentProfile } from '../data/types'

export const PAYMENT_PROFILE_QUERY_KEY = ['payment-profile'] as const

/**
 * `GET /payment-profile` mengembalikan 404 `PaymentProfile belum
 * dikonfigurasi` — bukan berupa objek kosong — bila MUA belum pernah mengisi
 * rekening (verified via uji manual, lihat changelog F06). Ini status VALID
 * (bukan kegagalan muat), khususnya untuk MUA yang belum menuntaskan
 * onboarding step 2 tapi sudah membuka `/settings/payment` langsung — jangan
 * tampilkan sebagai error, treat sebagai "belum ada data" (`null`).
 */
async function fetchPaymentProfile(): Promise<PaymentProfile | null> {
  try {
    const { data } = await api.get<PaymentProfile>('/payment-profile')
    return data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * `GET /payment-profile` — instruksi rekening tenant yang login (F06,
 * Bagian 1). Berbeda dari `onboarding-payment-step.tsx` (yang hanya PUT
 * sekali saat setup awal): halaman `/settings/payment` mengizinkan MUA
 * mengedit kapan saja (ganti rekening, dst). `data === null` (bukan
 * `isError`) berarti MUA belum pernah mengisi rekening.
 */
export function usePaymentProfile() {
  return useQuery({
    queryKey: PAYMENT_PROFILE_QUERY_KEY,
    queryFn: fetchPaymentProfile,
    staleTime: 30_000,
  })
}

/** `PUT /payment-profile` — idempoten, create bila belum ada, update bila sudah ada. */
export function useUpdatePaymentProfile() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('settings')

  return useMutation({
    mutationFn: (values: PaymentProfileFormValues) =>
      api.put<PaymentProfile>('/payment-profile', values).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PAYMENT_PROFILE_QUERY_KEY })
      // Checklist onboarding (`hasPaymentProfile`) bisa berubah kalau MUA
      // baru mengisi rekening lewat halaman ini (bukan lewat wizard onboarding).
      void queryClient.invalidateQueries({
        queryKey: ['onboarding', 'checklist'],
      })
      toast.success(t('payment.toast.saveSuccess'))
    },
    onError: handleServerError,
  })
}
