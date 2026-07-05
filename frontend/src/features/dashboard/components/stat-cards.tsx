import {
  CalendarCheck,
  Gauge,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { cn, formatCurrencyIDR } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { DashboardStats } from '../data/types'

function DeltaLabel({ deltaPct }: { deltaPct: number }) {
  const { t } = useTranslation('dashboard')
  const isPositive = deltaPct >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <p
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        isPositive
          ? 'text-emerald-600 dark:text-emerald-500'
          : 'text-destructive'
      )}
    >
      <Icon className='h-3.5 w-3.5' />
      <span>
        {isPositive ? '+' : ''}
        {deltaPct.toFixed(1)}%
      </span>
      <span className='font-normal text-muted-foreground'>
        {t('stats.vsLastMonth')}
      </span>
    </p>
  )
}

export function StatCards({ data }: { data: DashboardStats }) {
  const { t } = useTranslation('dashboard')
  const { auth } = useAuthStore()

  const quotaUsed = auth.subscription?.ordersUsedPeriod ?? data.quota.used
  const quotaLimit = data.quota.limit
  const quotaPct =
    quotaLimit > 0 ? Math.min(100, Math.round((quotaUsed / quotaLimit) * 100)) : 0

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            {t('stats.totalRevenue')}
          </CardTitle>
          <Wallet className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatCurrencyIDR(data.revenue.total)}
          </div>
          <DeltaLabel deltaPct={data.revenue.deltaPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            {t('stats.bookings')}
          </CardTitle>
          <CalendarCheck className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{data.bookings.total}</div>
          <DeltaLabel deltaPct={data.bookings.deltaPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            {t('stats.clients')}
          </CardTitle>
          <Users className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{data.clients.total}</div>
          <DeltaLabel deltaPct={data.clients.deltaPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            {t('stats.quota')}
          </CardTitle>
          <Gauge className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {quotaUsed}/{quotaLimit}
          </div>
          <Progress value={quotaPct} className='mt-2 h-1.5' />
          <p className='mt-1.5 text-xs text-muted-foreground'>
            {t('stats.quotaUsed', { pct: quotaPct })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
