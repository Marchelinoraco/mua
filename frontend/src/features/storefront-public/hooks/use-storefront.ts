import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { StorefrontResponse } from '../data/types'

export function storefrontQueryKey(slug: string) {
  return ['storefront-public', slug] as const
}

function fetchStorefront(slug: string): Promise<StorefrontResponse> {
  return api.get<StorefrontResponse>(`/s/${slug}`).then((r) => r.data)
}

/**
 * `GET /api/s/:slug` — publik, tanpa auth. `retry: false` karena 404 (slug
 * tak ada / storefront CANCELED) adalah respons valid yang tidak perlu
 * diulang, dan kita ingin state error tampil secepat mungkin di mobile.
 */
export function useStorefront(slug: string) {
  return useQuery({
    queryKey: storefrontQueryKey(slug),
    queryFn: () => fetchStorefront(slug),
    enabled: slug.length > 0,
    retry: false,
    staleTime: 30_000,
  })
}

/** `true` bila error berasal dari respons 404 (slug tak ada / dibatalkan). */
export function isStorefrontNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}
