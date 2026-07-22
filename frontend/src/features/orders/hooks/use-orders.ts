import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import type {
  OrderDetail,
  OrderListResponse,
  OrdersListParams,
} from '../data/types'

export const ORDERS_LIST_QUERY_KEY = ['orders', 'list'] as const
export const ORDERS_DETAIL_QUERY_KEY = (id: string) =>
  ['orders', 'detail', id] as const
/** Prefix dipakai untuk invalidate agregat klien (mis. totalBooking berubah saat confirm). */
const CLIENTS_QUERY_KEY = ['clients'] as const

function fetchOrders(params: OrdersListParams): Promise<OrderListResponse> {
  return api
    .get<OrderListResponse>('/orders', {
      params: {
        status: params.status?.length ? params.status.join(',') : undefined,
        from: params.from || undefined,
        to: params.to || undefined,
        q: params.q?.trim() ? params.q.trim() : undefined,
        page: params.page,
        limit: params.limit,
      },
    })
    .then((r) => r.data)
}

/** `GET /orders?status=&from=&to=&q=&page=&limit=` — daftar order (F09). */
export function useOrdersList(params: OrdersListParams) {
  return useQuery({
    queryKey: [...ORDERS_LIST_QUERY_KEY, params] as const,
    queryFn: () => fetchOrders(params),
    placeholderData: keepPreviousData,
  })
}

/** `GET /orders/:id` — detail lengkap, dipakai Sheet detail order. */
export function useOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: ORDERS_DETAIL_QUERY_KEY(id ?? ''),
    queryFn: () => api.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })
}

/**
 * Ekstrak pesan 409 (state machine F09: transisi tidak sah/slot bentrok, atau
 * F06: status pembayaran/booking tidak sesuai) dari respons NestJS default
 * (`{ statusCode, message, error }`) — pola sama dengan
 * `useDeleteCustomField`/`useCreateBlockedDate`. Untuk error lain, jatuhkan
 * ke `handleServerError` generik. Diekspor supaya dipakai bersama oleh
 * `use-payments.ts` (F06).
 */
export function handleOrderMutationError(
  error: unknown,
  fallbackMessage: string
): void {
  if (error instanceof AxiosError && error.response?.status === 409) {
    const message =
      (error.response?.data?.message as string | undefined) ??
      fallbackMessage
    toast.error(message)
    return
  }
  handleServerError(error)
}

/** Diekspor supaya dipakai bersama oleh `use-payments.ts` (F06) — satu pola invalidasi cache order. */
export function useInvalidateAfterMutation() {
  const queryClient = useQueryClient()
  return (id: string, alsoInvalidateClients = false) => {
    void queryClient.invalidateQueries({ queryKey: ORDERS_DETAIL_QUERY_KEY(id) })
    void queryClient.invalidateQueries({ queryKey: ORDERS_LIST_QUERY_KEY })
    if (alsoInvalidateClients) {
      void queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY })
    }
  }
}

/** `POST /orders/:id/complete` — hanya sah dari CONFIRMED/PAID. */
export function useCompleteOrder() {
  const invalidate = useInvalidateAfterMutation()
  const { t } = useTranslation('orders')

  return useMutation({
    mutationFn: (id: string) =>
      api.post<OrderDetail>(`/orders/${id}/complete`).then((r) => r.data),
    onSuccess: (data) => {
      invalidate(data.id)
      toast.success(t('toast.completeSuccess'))
    },
    onError: (error) =>
      handleOrderMutationError(error, t('toast.completeConflict')),
  })
}

/** `POST /orders/:id/cancel` — body `{ alasan }`, 5-500 karakter. */
export function useCancelOrder() {
  const invalidate = useInvalidateAfterMutation()
  const { t } = useTranslation('orders')

  return useMutation({
    mutationFn: ({ id, alasan }: { id: string; alasan: string }) =>
      api
        .post<OrderDetail>(`/orders/${id}/cancel`, { alasan })
        .then((r) => r.data),
    onSuccess: (data) => {
      invalidate(data.id)
      toast.success(t('toast.cancelSuccess'))
    },
    onError: (error) =>
      handleOrderMutationError(error, t('toast.cancelConflict')),
  })
}

/** `POST /orders/:id/reschedule` — body `{ tanggalAcara, jamMulai }`; 409 bila slot bentrok. */
export function useRescheduleOrder() {
  const invalidate = useInvalidateAfterMutation()
  const { t } = useTranslation('orders')

  return useMutation({
    mutationFn: ({
      id,
      tanggalAcara,
      jamMulai,
    }: {
      id: string
      tanggalAcara: string
      jamMulai: number
    }) =>
      api
        .post<OrderDetail>(`/orders/${id}/reschedule`, {
          tanggalAcara,
          jamMulai,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      invalidate(data.id)
      toast.success(t('toast.rescheduleSuccess'))
    },
    onError: (error) =>
      handleOrderMutationError(error, t('toast.rescheduleConflict')),
  })
}
