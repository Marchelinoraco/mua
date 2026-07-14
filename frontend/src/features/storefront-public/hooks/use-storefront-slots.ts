import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { StorefrontSlotsResponse } from '../data/types'

/**
 * `GET /api/s/:slug/slots?date=YYYY-MM-DD` (dari F05) — preview read-only,
 * dipakai untuk chip "jam tersedia" di storefront. Bukan bagian dari alur
 * booking (F04 belum ada).
 */
export function useStorefrontSlots(slug: string, date: string | undefined) {
  return useQuery({
    queryKey: ['storefront-public', slug, 'slots', date] as const,
    queryFn: () =>
      api
        .get<StorefrontSlotsResponse>(`/s/${slug}/slots`, { params: { date } })
        .then((r) => r.data),
    enabled: slug.length > 0 && Boolean(date),
    retry: false,
    staleTime: 15_000,
  })
}
