import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { PaymentTipe } from '@/features/dashboard/data/types'
import type { OrderDetail } from '../data/types'
import { handleOrderMutationError, useInvalidateAfterMutation } from './use-orders'

/**
 * Mutations dashboard F06 — konfirmasi/tolak bukti transfer & tandai tunai.
 * Menggantikan `useConfirmOrder` lama (`POST /orders/:id/confirm`, "jembatan
 * manual sampai F06") yang sudah dihapus dari UI: konfirmasi booking
 * sekarang SELALU lewat Payment (confirm bukti ATAU tandai tunai) supaya
 * setiap transisi status booking punya jejak audit (FR-F06-8, AC-F06-3) —
 * endpoint lama masih ada di backend (tidak diubah) tapi tidak lagi dipanggil FE.
 */

/** `POST /orders/:id/payments/:paymentId/confirm` — hanya sah dari Payment.status SUBMITTED. */
export function useConfirmPayment() {
  const invalidate = useInvalidateAfterMutation()
  const { t } = useTranslation('orders')

  return useMutation({
    mutationFn: ({
      orderId,
      paymentId,
    }: {
      orderId: string
      paymentId: string
    }) =>
      api
        .post<OrderDetail>(`/orders/${orderId}/payments/${paymentId}/confirm`)
        .then((r) => r.data),
    onSuccess: (data) => {
      invalidate(data.id, true)
      toast.success(t('payments.toast.confirmSuccess'))
    },
    onError: (error) =>
      handleOrderMutationError(error, t('payments.toast.confirmConflict')),
  })
}

/** `POST /orders/:id/payments/:paymentId/reject` — body `{ alasan }`, 5-500 karakter. */
export function useRejectPayment() {
  const invalidate = useInvalidateAfterMutation()
  const { t } = useTranslation('orders')

  return useMutation({
    mutationFn: ({
      orderId,
      paymentId,
      alasan,
    }: {
      orderId: string
      paymentId: string
      alasan: string
    }) =>
      api
        .post<OrderDetail>(`/orders/${orderId}/payments/${paymentId}/reject`, {
          alasan,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      invalidate(data.id)
      toast.success(t('payments.toast.rejectSuccess'))
    },
    onError: (error) =>
      handleOrderMutationError(error, t('payments.toast.rejectConflict')),
  })
}

/** `POST /orders/:id/payments/mark-cash` — body `{ tipe, jumlah, catatanMua? }` (FR-F06-7). */
export function useMarkCashPayment() {
  const invalidate = useInvalidateAfterMutation()
  const { t } = useTranslation('orders')

  return useMutation({
    mutationFn: ({
      orderId,
      tipe,
      jumlah,
      catatanMua,
    }: {
      orderId: string
      tipe: PaymentTipe
      jumlah: number
      catatanMua?: string
    }) =>
      api
        .post<OrderDetail>(`/orders/${orderId}/payments/mark-cash`, {
          tipe,
          jumlah,
          catatanMua,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      invalidate(data.id, true)
      toast.success(t('payments.toast.markCashSuccess'))
    },
    onError: (error) =>
      handleOrderMutationError(error, t('payments.toast.markCashConflict')),
  })
}
