import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { hhmmKeMenit } from '@/lib/time'
import type { AvailabilityFormValues } from '../data/schema'
import type { Availability } from '../data/types'

export const AVAILABILITY_QUERY_KEY = ['availability'] as const

function fetchAvailability(): Promise<Availability[]> {
  return api.get<Availability[]>('/availability').then((r) => r.data)
}

export function useAvailability() {
  return useQuery({
    queryKey: AVAILABILITY_QUERY_KEY,
    queryFn: fetchAvailability,
    staleTime: 30_000,
  })
}

/** PUT /availability — body array langsung, hanya hari yang `aktif`. */
export function useUpdateAvailability() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('schedule')

  return useMutation({
    mutationFn: (values: AvailabilityFormValues) => {
      const payload = values.days
        .filter((day) => day.aktif)
        .map((day) => ({
          hari: day.hari,
          jamMulai: hhmmKeMenit(day.jamMulai)!,
          jamSelesai: hhmmKeMenit(day.jamSelesai)!,
          slotDurasi: day.slotDurasi,
          kapasitas: day.kapasitas,
        }))
      return api
        .put<Availability[]>('/availability', payload)
        .then((r) => r.data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AVAILABILITY_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success(t('availability.toast.saveSuccess'))
    },
    onError: handleServerError,
  })
}
