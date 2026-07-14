import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CalendarResponse } from '../data/types'

export const CALENDAR_QUERY_KEY = ['calendar'] as const

function fetchCalendar(from: string, to: string): Promise<CalendarResponse> {
  return api
    .get<CalendarResponse>('/calendar', { params: { from, to } })
    .then((r) => r.data)
}

/** `from`/`to` format "YYYY-MM-DD". Rentang maks 100 hari (ditegakkan BE). */
export function useCalendar(from: string, to: string) {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, from, to],
    queryFn: () => fetchCalendar(from, to),
    staleTime: 30_000,
  })
}
