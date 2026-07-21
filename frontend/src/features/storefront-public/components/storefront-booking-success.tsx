import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/date'
import { formatCurrencyIDR } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { CreateBookingResponse } from '../data/types'

type StorefrontBookingSuccessProps = {
  data: CreateBookingResponse
}

/** Format sisa waktu hold sebagai "MM:SS" (atau "0:00" bila sudah lewat). */
function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Layar konfirmasi setelah `POST /s/:slug/bookings` sukses (201) — FR-F04-6. */
export function StorefrontBookingSuccess({
  data,
}: StorefrontBookingSuccessProps) {
  const { t } = useTranslation('storefront')
  const holdUntilMs = new Date(data.holdUntil).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleCopyKode() {
    try {
      await navigator.clipboard.writeText(data.kodeBooking)
      toast.success(t('booking.success.copied'))
    } catch {
      // Clipboard API bisa gagal (izin browser/http tanpa TLS) — abaikan
      // secara senyap, kode tetap terlihat jelas untuk disalin manual.
    }
  }

  const msRemaining = holdUntilMs - now

  return (
    <div className='space-y-5 text-center'>
      <div className='flex flex-col items-center gap-2'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40'>
          <CheckCircle2 className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
        </div>
        <h3 className='text-lg font-semibold'>{t('booking.success.title')}</h3>
      </div>

      <div className='rounded-lg border bg-muted/40 p-4'>
        <p className='text-xs text-muted-foreground'>
          {t('booking.success.kodeLabel')}
        </p>
        <div className='mt-1 flex items-center justify-center gap-2'>
          <span className='text-2xl font-bold tracking-wide'>
            {data.kodeBooking}
          </span>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={handleCopyKode}
            aria-label={t('booking.success.copy')}
          >
            <Copy className='h-4 w-4' />
          </Button>
        </div>
        <p className='mt-2 text-xs text-muted-foreground'>
          {t('booking.success.holdNotice')}{' '}
          <span className='font-medium text-foreground'>
            {formatDateTime(data.holdUntil, 'HH:mm')}
          </span>{' '}
          ({formatCountdown(msRemaining)})
        </p>
      </div>

      <div className='space-y-2 rounded-lg border p-4 text-start'>
        <p className='text-sm font-medium'>
          {t('booking.success.paymentTitle')}
        </p>
        {data.paymentProfile ? (
          <div className='space-y-1 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>
                {t('booking.success.bank')}
              </span>
              <span>{data.paymentProfile.namaBank}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>
                {t('booking.success.noRek')}
              </span>
              <span className='font-mono'>
                {data.paymentProfile.nomorRekening}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>
                {t('booking.success.pemilik')}
              </span>
              <span>{data.paymentProfile.namaPemilik}</span>
            </div>
            {data.paymentProfile.instruksiTambahan && (
              <p className='mt-1 text-xs text-muted-foreground'>
                {data.paymentProfile.instruksiTambahan}
              </p>
            )}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>
            {t('booking.success.paymentMissing')}
          </p>
        )}

        <Separator />

        <div className='flex justify-between text-sm'>
          <span className='text-muted-foreground'>
            {t('booking.success.totalAmount')}
          </span>
          <span>{formatCurrencyIDR(data.totalHarga)}</span>
        </div>
        <div className='flex justify-between text-sm font-semibold text-[var(--sf-primary)]'>
          <span>{t('booking.success.dpAmount')}</span>
          <span>{formatCurrencyIDR(data.dpAmount)}</span>
        </div>
      </div>

      <Button asChild className='w-full'>
        <Link
          to='/booking-status/$kode'
          params={{ kode: data.kodeBooking }}
          target='_blank'
        >
          {t('booking.success.viewStatus')}
        </Link>
      </Button>
    </div>
  )
}
