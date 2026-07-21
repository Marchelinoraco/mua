import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { StorefrontSlotsResponse } from '../data/types'

/**
 * `GET /api/s/:slug/slots?date=YYYY-MM-DD` (dari F05) — dipakai untuk chip
 * "jam tersedia" di preview ketersediaan (`storefront-availability.tsx`) DAN
 * di-REUSE oleh step jadwal form booking mandiri (F04,
 * `storefront-booking-step-schedule.tsx`) — jangan duplikasi query slot.
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
