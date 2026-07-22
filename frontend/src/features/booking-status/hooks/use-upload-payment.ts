import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '@/lib/api'
import type { PaymentTipe } from '@/features/dashboard/data/types'

export interface UploadPaymentPayload {
  kode: string
  phone: string
  tipe: PaymentTipe
  jumlah: number
  catatanKlien?: string
  bukti: File
}

export interface PaymentUploadResponse {
  id: string
  tipe: string
  jumlah: number
  status: string
  buktiFotoUrl: string | null
  createdAt: string
}

/**
 * `POST /api/bookings/:kode/payments` (F06, publik) — multipart/form-data.
 * Throttle 10/menit/IP di backend. 201 sukses; 400 validasi; 404 booking tak
 * ada/nomor salah (SERAGAM, jangan bedakan pesan — lihat
 * `getPaymentUploadErrorMessage`); 409 status booking tidak sesuai tipe
 * pembayaran; 429 throttle.
 *
 * PENTING: instance `api` (lib/api.ts) memasang default header
 * `Content-Type: application/json` di level instance. Untuk `FormData`,
 * axios HANYA melewatkan body apa adanya (multipart, boundary otomatis dari
 * browser) bila header Content-Type TIDAK berisi `application/json` — kalau
 * tidak, axios malah men-stringify FormData jadi JSON (lihat
 * `transformRequest` di axios). Override eksplisit ke `undefined` di sini
 * supaya browser yang menyusun header `multipart/form-data; boundary=...`.
 */
export function useUploadPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      kode,
      phone,
      tipe,
      jumlah,
      catatanKlien,
      bukti,
    }: UploadPaymentPayload) => {
      const form = new FormData()
      form.append('tipe', tipe)
      form.append('jumlah', String(jumlah))
      form.append('phone', phone)
      if (catatanKlien) form.append('catatanKlien', catatanKlien)
      form.append('bukti', bukti)

      return api
        .post<PaymentUploadResponse>(`/bookings/${kode}/payments`, form, {
          headers: { 'Content-Type': undefined },
        })
        .then((r) => r.data)
    },
    onSuccess: (_data, variables) => {
      // Prefix match — mencakup queryKey ['booking-status', kode, phone]
      // tanpa perlu tahu nilai `phone` yang persis dipakai query aktif.
      void queryClient.invalidateQueries({
        queryKey: ['booking-status', variables.kode],
      })
    },
  })
}

/** `true` bila error 404 — booking tak ditemukan ATAU nomor WA tidak cocok (SERAGAM, jangan bedakan pesan). */
export function isPaymentUploadNotFoundError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 404
}

/** `true` bila error 409 — status booking tidak sesuai tipe pembayaran (mis. upload DP padahal sudah CONFIRMED). */
export function isPaymentUploadConflictError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 409
}

/** `true` bila error 429 — throttle percobaan upload. */
export function isPaymentUploadThrottleError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 429
}

/**
 * Ekstrak pesan error dari respons NestJS default — `message` array (DTO
 * validation) atau string tunggal (exception manual) — pola sama dengan
 * `getBookingErrorMessage` (storefront-public/hooks/use-create-booking.ts).
 */
export function getPaymentUploadErrorMessage(
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
