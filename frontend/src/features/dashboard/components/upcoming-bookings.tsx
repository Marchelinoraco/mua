import { CalendarClock, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import type { UpcomingBooking } from '../data/types'

export function UpcomingBookings({
  bookings,
}: {
  bookings: UpcomingBooking[]
}) {
  const { t } = useTranslation('dashboard')

  if (bookings.length === 0) {
    return (
      <p className='py-4 text-sm text-muted-foreground'>
        {t('upcomingBookings.empty')}
      </p>
    )
  }

  return (
    <ul className='space-y-4'>
      {bookings.map((booking) => (
        <li key={booking.id} className='flex items-start gap-3'>
          <div className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <CalendarClock className='h-4 w-4' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium'>
              {booking.clientName}
            </p>
            <p className='truncate text-xs text-muted-foreground'>
              {booking.serviceName}
            </p>
            <p className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
              <span>{formatDate(booking.tanggal, 'd MMM')}</span>
              <span aria-hidden='true'>&middot;</span>
              <span>{booking.jamMulai}</span>
            </p>
            <p className='mt-0.5 flex items-center gap-1 text-xs text-muted-foreground'>
              <MapPin className='h-3 w-3 shrink-0' />
              <span className='truncate'>{booking.lokasi}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
