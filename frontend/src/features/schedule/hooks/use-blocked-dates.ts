import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import type { BlockedDate } from '../data/types'

export const BLOCKED_DATES_QUERY_KEY = ['blocked-dates'] as const

export interface CreateBlockedDatePayload {
  tanggalMulai: string
  tanggalSelesai: string
  alasan?: string
}

function fetchBlockedDates(range?: {
  from: string
  to: string
}): Promise<BlockedDate[]> {
  return api
    .get<BlockedDate[]>('/blocked-dates', { params: range })
    .then((r) => r.data)
}

/** @param range - opsional; tanpa filter, BE mengembalikan semua data. */
export function useBlockedDates(range?: { from: string; to: string }) {
  return useQuery({
    queryKey: range
      ? [...BLOCKED_DATES_QUERY_KEY, range]
      : BLOCKED_DATES_QUERY_KEY,
    queryFn: () => fetchBlockedDates(range),
    staleTime: 30_000,
  })
}

export function useCreateBlockedDate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('schedule')

  return useMutation({
    mutationFn: (payload: CreateBlockedDatePayload) =>
      api
        .post<BlockedDate>('/blocked-dates', payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BLOCKED_DATES_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success(t('blockedDates.toast.createSuccess'))
    },
    onError: (error: unknown) => {
      // FR-F05 edge case: 409 bila beririsan booking CONFIRMED/PAID —
      // tampilkan pesan spesifik dari server ("Pindahkan booking tersebut...").
      if (error instanceof AxiosError && error.response?.status === 409) {
        const message =
          (error.response?.data?.message as string | undefined) ??
          t('blockedDates.toast.conflict')
        toast.error(message)
        return
      }
      handleServerError(error)
    },
  })
}

export function useDeleteBlockedDate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('schedule')

  return useMutation({
    mutationFn: (id: string) => api.delete(`/blocked-dates/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BLOCKED_DATES_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success(t('blockedDates.toast.deleteSuccess'))
    },
    onError: handleServerError,
  })
}
