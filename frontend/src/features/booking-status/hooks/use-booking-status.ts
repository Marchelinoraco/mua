import { AxiosError } from 'axios'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BookingStatusResponse } from '../data/types'

/**
 * `GET /api/bookings/:kode` (F04, FR-F04-7) — tanpa `phone`, respons minimal
 * (`requiresOtp: true`). Dengan `phone` yang cocok, respons detail penuh.
 * Throttle 20/menit/IP di backend. `retry: false` — 404 (kode tak ada) adalah
 * hasil valid yang tidak perlu diulang.
 *
 * `placeholderData: keepPreviousData` — saat klien submit nomor WA baru,
 * queryKey berubah (fetch baru); ini mencegah UI "flash" balik ke skeleton
 * penuh, form verifikasi tetap tampil sambil `isFetching` dipakai untuk
 * status loading di tombol submit.
 */
export function useBookingStatus(kode: string, phone: string | undefined) {
  return useQuery({
    queryKey: ['booking-status', kode, phone] as const,
    queryFn: () =>
      api
        .get<BookingStatusResponse>(`/bookings/${kode}`, {
          params: phone ? { phone } : undefined,
        })
        .then((r) => r.data),
    enabled: kode.length > 0,
    retry: false,
    placeholderData: keepPreviousData,
  })
}

/** `true` bila error berasal dari respons 404 (kode booking tak ditemukan). */
export function isBookingStatusNotFoundError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404
}
