import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { formatCurrencyIDR } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BOOKING_STATUS_BADGE_CLASS } from '../data/status'
import type { RecentBooking } from '../data/types'

export function RecentBookingsTable({
  bookings,
}: {
  bookings: RecentBooking[]
}) {
  const { t } = useTranslation('dashboard')

  if (bookings.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-muted-foreground'>
        {t('recentBookings.empty')}
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('recentBookings.columns.code')}</TableHead>
          <TableHead>{t('recentBookings.columns.client')}</TableHead>
          <TableHead>{t('recentBookings.columns.service')}</TableHead>
          <TableHead>{t('recentBookings.columns.date')}</TableHead>
          <TableHead className='text-right'>
            {t('recentBookings.columns.dp')}
          </TableHead>
          <TableHead>{t('recentBookings.columns.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className='font-medium whitespace-nowrap'>
              {booking.kode}
            </TableCell>
            <TableCell>{booking.clientName}</TableCell>
            <TableCell className='text-muted-foreground'>
              {booking.serviceName}
            </TableCell>
            <TableCell className='whitespace-nowrap'>
              {formatDate(booking.tanggal, 'd MMM yyyy')}
            </TableCell>
            <TableCell className='text-right tabular-nums'>
              {formatCurrencyIDR(booking.dpAmount)}
            </TableCell>
            <TableCell>
              <Badge className={BOOKING_STATUS_BADGE_CLASS[booking.status]}>
                {t(`status.${booking.status}`)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
