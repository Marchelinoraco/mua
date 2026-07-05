import { useQuery } from '@tanstack/react-query'
import { mockDashboardStats } from '../data/mock-stats'
import type { DashboardStats } from '../data/types'

function fetchDashboardStats(): Promise<DashboardStats> {
  // TODO: ganti ke api.get('/dashboard/stats') saat endpoint tersedia (pasca F02–F04)
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDashboardStats), 300)
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  })
}
