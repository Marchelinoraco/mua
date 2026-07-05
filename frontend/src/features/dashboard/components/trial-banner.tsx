import { differenceInDays, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { format } from 'date-fns'
import { AlertTriangle, Bell, CreditCard } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function TrialBanner() {
  const { auth } = useAuthStore()
  const subscription = auth.subscription

  // Only show for TRIALING status
  if (!subscription || subscription.status !== 'TRIALING') return null

  const endDate = parseISO(subscription.currentPeriodEnd)
  const daysLeft = differenceInDays(endDate, new Date())
  const formattedDate = format(endDate, 'd MMMM yyyy', { locale: localeId })

  const isUrgent = daysLeft <= 3

  if (isUrgent) {
    return (
      <Alert className='mb-4 border-destructive/50 bg-destructive/10'>
        <AlertTriangle className='h-4 w-4 text-destructive' />
        <AlertDescription className='flex flex-wrap items-center justify-between gap-2'>
          <span className='text-destructive'>
            <strong>Trial berakhir dalam {daysLeft} hari</strong> — berlangganan
            sebelum {formattedDate} agar storefront tetap aktif.
          </span>
          <Button asChild size='sm' variant='destructive'>
            <Link to='/subscription'>
              <CreditCard className='h-3.5 w-3.5' />
              Berlangganan Sekarang
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className='mb-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'>
      <Bell className='h-4 w-4 text-amber-600 dark:text-amber-400' />
      <AlertDescription className='text-amber-800 dark:text-amber-200'>
        Trial Anda aktif —{' '}
        <strong>{daysLeft} hari tersisa</strong>. Berlangganan sebelum{' '}
        {formattedDate}.
      </AlertDescription>
    </Alert>
  )
}
