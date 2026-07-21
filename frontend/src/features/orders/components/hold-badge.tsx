import { AlertTriangle, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getHoldRemaining } from '../lib/hold-remaining'

/** Badge sisa waktu hold DP — hanya dirender untuk order `AWAITING_DP` dengan `holdUntil`. */
export function HoldBadge({
  holdUntil,
  now,
}: {
  holdUntil: string | null
  now: number
}) {
  const { t } = useTranslation('orders')
  const remaining = getHoldRemaining(holdUntil, now)
  if (!remaining) return null

  if (remaining.status === 'expired') {
    return (
      <span className='flex items-center gap-1 text-xs font-medium text-destructive'>
        <AlertTriangle className='size-3' />
        {t('holdRemaining.expired')}
      </span>
    )
  }

  const label =
    remaining.hours > 0
      ? t('holdRemaining.hoursMinutes', {
          hours: remaining.hours,
          minutes: remaining.minutes,
        })
      : t('holdRemaining.minutes', { minutes: remaining.minutes })

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs',
        remaining.status === 'warning'
          ? 'font-medium text-destructive'
          : 'text-muted-foreground'
      )}
    >
      {remaining.status === 'warning' ? (
        <AlertTriangle className='size-3' />
      ) : (
        <Clock className='size-3' />
      )}
      {label}
    </span>
  )
}
