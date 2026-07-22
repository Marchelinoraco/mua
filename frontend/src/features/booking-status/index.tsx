import { useEffect, useState } from 'react'
import { BookingStatusDetail } from './components/booking-status-detail'
import { BookingStatusLoadError } from './components/booking-status-load-error'
import { BookingStatusNotFound } from './components/booking-status-not-found'
import { BookingStatusSkeleton } from './components/booking-status-skeleton'
import { BookingStatusVerifyForm } from './components/booking-status-verify-form'
import {
  isBookingStatusNotFoundError,
  useBookingStatus,
} from './hooks/use-booking-status'

type BookingStatusPageProps = {
  kode: string
}

/**
 * Halaman status booking publik `/booking-status/:kode` (F04, FR-F04-7) —
 * tanpa login. Verifikasi ringan via nomor WA (BUKAN OTP asli — F08 belum
 * ada, lihat `use-booking-status.ts`).
 */
export function BookingStatusPage({ kode }: BookingStatusPageProps) {
  const [phone, setPhone] = useState<string | undefined>(undefined)
  const { data, isLoading, isFetching, isError, error } = useBookingStatus(
    kode,
    phone
  )

  useEffect(() => {
    document.title = `Booking ${kode} — MuaGlow`
  }, [kode])

  if (isLoading && !data) return <BookingStatusSkeleton />

  if (isError) {
    if (isBookingStatusNotFoundError(error)) return <BookingStatusNotFound />
    return <BookingStatusLoadError />
  }

  if (!data) return null

  if (data.requiresOtp) {
    return (
      <BookingStatusVerifyForm
        minimal={data}
        onVerify={setPhone}
        isVerifying={isFetching}
        mismatch={phone !== undefined && !isFetching}
      />
    )
  }

  // `phone` dijamin terisi di sini — satu-satunya jalan mencapai
  // `requiresOtp: false` adalah lewat `BookingStatusVerifyForm.onVerify`
  // (yang memanggil `setPhone`) diikuti backend mencocokkan nomornya.
  return <BookingStatusDetail data={data} phone={phone ?? ''} />
}
