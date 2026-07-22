import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Province } from '../data/types'

export const PROVINCES_QUERY_KEY = ['wilayah', 'provinces'] as const

function fetchProvinces(): Promise<Province[]> {
  return api.get<Province[]>('/wilayah/provinces').then((res) => res.data)
}

/**
 * `GET /api/wilayah/provinces` — publik, tanpa auth. Daftar provinsi
 * Indonesia adalah data referensi statis (tidak pernah berubah dalam siklus
 * hidup aplikasi), jadi `staleTime: Infinity` — cukup diambil sekali per
 * sesi lalu di-cache oleh TanStack Query, tidak perlu re-fetch berkala.
 */
export function useProvinces() {
  return useQuery({
    queryKey: PROVINCES_QUERY_KEY,
    queryFn: fetchProvinces,
    staleTime: Infinity,
  })
}
