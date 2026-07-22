import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Regency } from '../data/types'

export function regenciesQueryKey(provinceId: string) {
  return ['wilayah', 'regencies', provinceId] as const
}

function fetchRegencies(provinceId: string): Promise<Regency[]> {
  return api
    .get<Regency[]>('/wilayah/regencies', { params: { provinceId } })
    .then((res) => res.data)
}

/**
 * `GET /api/wilayah/regencies?provinceId=` — publik, tanpa auth. Hanya
 * aktif (`enabled`) setelah provinsi dipilih — mencegah panggilan dengan
 * `provinceId` kosong yang akan ditolak backend dengan 400. Data referensi
 * statis per provinsi, jadi `staleTime: Infinity` sama seperti provinsi.
 */
export function useRegencies(provinceId: string | undefined) {
  return useQuery({
    queryKey: regenciesQueryKey(provinceId ?? ''),
    queryFn: () => fetchRegencies(provinceId ?? ''),
    enabled: Boolean(provinceId),
    staleTime: Infinity,
  })
}
