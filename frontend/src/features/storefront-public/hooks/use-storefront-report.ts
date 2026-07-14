import { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ReportFormValues } from '../data/schema'

interface ReportResponse {
  ok: true
}

/** `POST /api/s/:slug/report` — 201 sukses; 400 validasi; 429 throttle 3/menit. */
export function useStorefrontReport(slug: string) {
  return useMutation({
    mutationFn: (values: ReportFormValues) =>
      api
        .post<ReportResponse>(`/s/${slug}/report`, {
          alasan: values.alasan,
          kontak: values.kontak ? values.kontak : undefined,
        })
        .then((r) => r.data),
  })
}

/** `true` bila error berasal dari respons 429 (throttle). */
export function isStorefrontReportThrottleError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 429
}
