import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import type { CustomFieldFormValues } from '../data/schema'
import type { CustomField } from '../data/types'

export const CUSTOM_FIELDS_QUERY_KEY = ['custom-fields'] as const

function fetchCustomFields(): Promise<CustomField[]> {
  return api.get<CustomField[]>('/custom-fields').then((r) => r.data)
}

export function useCustomFields() {
  return useQuery({
    queryKey: CUSTOM_FIELDS_QUERY_KEY,
    queryFn: fetchCustomFields,
    staleTime: 30_000,
  })
}

export function useCreateCustomField() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('services')

  return useMutation({
    mutationFn: (values: CustomFieldFormValues) =>
      api.post<CustomField>('/custom-fields', values).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS_QUERY_KEY })
      toast.success(t('toast.customFieldCreateSuccess'))
    },
    onError: handleServerError,
  })
}

export function useUpdateCustomField() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('services')

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: CustomFieldFormValues
    }) => api.put<CustomField>(`/custom-fields/${id}`, values).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS_QUERY_KEY })
      toast.success(t('toast.customFieldUpdateSuccess'))
    },
    onError: handleServerError,
  })
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('services')

  return useMutation({
    mutationFn: (id: string) => api.delete(`/custom-fields/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS_QUERY_KEY })
      toast.success(t('toast.customFieldDeleteSuccess'))
    },
    onError: (error: unknown) => {
      // FR khusus: backend menolak (409) jika field masih dipakai booking
      // historis — tampilkan pesan spesifik itu, bukan pesan generik.
      if (error instanceof AxiosError && error.response?.status === 409) {
        const message =
          (error.response?.data?.message as string | undefined) ??
          (error.response?.data?.title as string | undefined) ??
          t('toast.customFieldDeleteConflict')
        toast.error(message)
        return
      }
      handleServerError(error)
    },
  })
}
