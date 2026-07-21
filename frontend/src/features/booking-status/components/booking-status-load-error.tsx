import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Fallback untuk error non-404 (5xx/jaringan/throttle) saat memuat status booking. */
export function BookingStatusLoadError() {
  const { t } = useTranslation('bookingStatus')

  return (
    <div className='flex h-svh flex-col items-center justify-center gap-3 px-6 text-center'>
      <AlertTriangle className='h-10 w-10 text-destructive' />
      <h1 className='text-lg font-semibold'>{t('loadErrorTitle')}</h1>
      <p className='max-w-xs text-sm text-muted-foreground'>{t('loadError')}</p>
    </div>
  )
}
