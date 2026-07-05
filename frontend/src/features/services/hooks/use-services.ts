import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import type { ServiceFormValues } from '../data/schema'
import type { Service } from '../data/types'

export const SERVICES_QUERY_KEY = ['services'] as const

function fetchServices(): Promise<Service[]> {
  return api.get<Service[]>('/services').then((r) => r.data)
}

export function useServices() {
  return useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: fetchServices,
    staleTime: 30_000,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('services')

  return useMutation({
    mutationFn: (values: ServiceFormValues) =>
      api.post<Service>('/services', values).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
      toast.success(t('toast.createSuccess'))
    },
    onError: handleServerError,
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('services')

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ServiceFormValues }) =>
      api.put<Service>(`/services/${id}`, values).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
      toast.success(t('toast.updateSuccess'))
    },
    onError: handleServerError,
  })
}

export function useToggleServiceAktif() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('services')

  return useMutation({
    mutationFn: ({ id, aktif }: { id: string; aktif: boolean }) =>
      api.patch<Service>(`/services/${id}`, { aktif }).then((r) => r.data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY })
      toast.success(
        data.aktif ? t('toast.activateSuccess') : t('toast.deactivateSuccess')
      )
    },
    onError: handleServerError,
  })
}
