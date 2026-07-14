import { CalendarOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { BOOKING_STATUS_BADGE_CLASS } from '@/features/dashboard/data/status'
import type { CalendarDay } from '../data/types'

const MAX_BOOKINGS_VISIBLE = 2

type ScheduleCalendarDayProps = {
  dateNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  day: CalendarDay | undefined
}

export function ScheduleCalendarDay({
  dateNumber,
  isCurrentMonth,
  isToday,
  day,
}: ScheduleCalendarDayProps) {
  const { t } = useTranslation('schedule')
  const { t: tDashboard } = useTranslation('dashboard')
  const bookings = day?.bookings ?? []
  const extra = bookings.length - MAX_BOOKINGS_VISIBLE

  return (
    <div
      className={cn(
        'flex min-h-24 flex-col gap-1 rounded-md border p-1.5 sm:min-h-28 sm:p-2',
        !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
        day?.blocked && isCurrentMonth && 'bg-destructive/5'
      )}
    >
      <div className='flex items-center justify-between'>
        <span
          className={cn(
            'text-xs font-medium sm:text-sm',
            isToday &&
              'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground'
          )}
        >
          {dateNumber}
        </span>
        {day?.blocked && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant='outline'
                className='gap-1 border-destructive/40 px-1 text-[10px] text-destructive'
              >
                <CalendarOff className='h-3 w-3' />
                <span className='hidden sm:inline'>
                  {t('calendar.blocked')}
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {day.blockedReason || t('calendar.blockedNoReason')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {isCurrentMonth && bookings.length > 0 && (
        <div className='flex flex-col gap-0.5'>
          {bookings.slice(0, MAX_BOOKINGS_VISIBLE).map((booking) => (
            <Tooltip key={booking.id}>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    'w-full justify-start truncate text-[10px]',
                    BOOKING_STATUS_BADGE_CLASS[booking.statusBooking]
                  )}
                >
                  {booking.kodeBooking}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {booking.clientNama} ·{' '}
                {tDashboard(`status.${booking.statusBooking}`)}
              </TooltipContent>
            </Tooltip>
          ))}
          {extra > 0 && (
            <span className='text-[10px] text-muted-foreground'>
              {t('calendar.moreBookings', { count: extra })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
