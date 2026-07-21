import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import type {
  ClientDetail,
  ClientListResponse,
  ClientResponse,
  ClientsListParams,
} from '../data/types'

export const CLIENTS_LIST_QUERY_KEY = ['clients', 'list'] as const
export const CLIENTS_DETAIL_QUERY_KEY = (id: string) =>
  ['clients', 'detail', id] as const

/** `GET /clients?q=&page=&limit=` — daftar klien, urut nama asc. */
export function useClientsList(params: ClientsListParams) {
  return useQuery({
    queryKey: [...CLIENTS_LIST_QUERY_KEY, params] as const,
    queryFn: () =>
      api
        .get<ClientListResponse>('/clients', {
          params: {
            q: params.q?.trim() ? params.q.trim() : undefined,
            page: params.page,
            limit: params.limit,
          },
        })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}

/** `GET /clients/:id` — profil + riwayat booking, dipakai Sheet detail klien. */
export function useClientDetail(id: string | undefined) {
  return useQuery({
    queryKey: CLIENTS_DETAIL_QUERY_KEY(id ?? ''),
    queryFn: () =>
      api.get<ClientDetail>(`/clients/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })
}

/** `PUT /clients/:id/notes` — `catatan: string | null`. */
export function useUpdateClientNotes() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('clients')

  return useMutation({
    mutationFn: ({ id, catatan }: { id: string; catatan: string | null }) =>
      api
        .put<ClientResponse>(`/clients/${id}/notes`, { catatan })
        .then((r) => r.data),
    onSuccess: (data) => {
      // Response PUT tidak menyertakan `bookings` — merge field yang berubah
      // ke cache detail yang sudah ada agar riwayat booking tidak hilang.
      queryClient.setQueryData<ClientDetail>(
        CLIENTS_DETAIL_QUERY_KEY(data.id),
        (old) => (old ? { ...old, catatan: data.catatan } : old)
      )
      void queryClient.invalidateQueries({ queryKey: CLIENTS_LIST_QUERY_KEY })
      toast.success(t('toast.notesSaveSuccess'))
    },
    onError: handleServerError,
  })
}
