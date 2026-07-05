import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import type { TransportRule } from '../data/types'

export const TRANSPORT_RULE_QUERY_KEY = ['transport-rule'] as const

function fetchTransportRule(): Promise<TransportRule | null> {
  return api.get<TransportRule | null>('/transport-rule').then((r) => r.data)
}

export function useTransportRule() {
  return useQuery({
    queryKey: TRANSPORT_RULE_QUERY_KEY,
    queryFn: fetchTransportRule,
    staleTime: 30_000,
  })
}

export function useUpsertTransportRule() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('services')

  return useMutation({
    mutationFn: (values: TransportRule) =>
      api.put<TransportRule>('/transport-rule', values).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: TRANSPORT_RULE_QUERY_KEY,
      })
      toast.success(t('toast.transportRuleSaved'))
    },
    onError: handleServerError,
  })
}
