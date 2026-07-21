import { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreateBookingPayload, CreateBookingResponse } from '../data/types'

/**
 * `POST /api/s/:slug/bookings` (F04) — throttle 10/menit/IP di backend.
 * 201 sukses; 400 validasi (service invalid/custom field wajib kosong); 404
 * tenant tak ditemukan/nonaktif; 409 slot bentrok (pesan server apa adanya);
 * 429 throttle.
 */
export function useCreateBooking(slug: string) {
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) =>
      api
        .post<CreateBookingResponse>(`/s/${slug}/bookings`, payload)
        .then((r) => r.data),
  })
}

/** `true` bila error 409 — slot yang dipilih baru saja terisi/bentrok. */
export function isBookingConflictError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 409
}

/** `true` bila error 429 — throttle percobaan booking. */
export function isBookingThrottleError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 429
}

/** `true` bila error 404 — storefront tak ditemukan/sedang tidak menerima booking. */
export function isBookingNotFoundError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404
}

/**
 * Ekstrak pesan error dari respons NestJS default (`ValidationPipe` global
 * mengembalikan `message` sebagai ARRAY string untuk error DTO, sedangkan
 * exception manual seperti `BadRequestException('Slot baru saja terisi.')`
 * mengembalikan `message` sebagai STRING tunggal) — tampilkan apa adanya
 * sesuai instruksi kontrak API (khususnya pesan 409).
 */
export function getBookingErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message
    if (Array.isArray(message) && message.length > 0) {
      return String(message[0])
    }
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }
  return fallback
}
