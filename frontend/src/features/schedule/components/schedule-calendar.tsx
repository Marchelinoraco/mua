import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatMonthYear, getActiveLocale } from '@/lib/date'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCalendar } from '../hooks/use-calendar'
import { ScheduleCalendarDay } from './schedule-calendar-day'

const WEEK_STARTS_ON = 1 // Senin

export function ScheduleCalendar() {
  const { t } = useTranslation('schedule')
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  const from = format(startOfMonth(month), 'yyyy-MM-dd')
  const to = format(endOfMonth(month), 'yyyy-MM-dd')

  const { data, isLoading, isError } = useCalendar(from, to)

  const gridDays = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), {
      weekStartsOn: WEEK_STARTS_ON,
    })
    const gridEnd = endOfWeek(endOfMonth(month), {
      weekStartsOn: WEEK_STARTS_ON,
    })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [month])

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON })
    return eachDayOfInterval({
      start,
      end: endOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }),
    }).map((d) => format(d, 'EEEEEE', { locale: getActiveLocale() }))
  }, [])

  function findDay(date: Date) {
    return data?.days.find((d) => isSameDay(new Date(`${d.date}T00:00:00`), date))
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between gap-2 space-y-0'>
        <div>
          <CardTitle>{t('calendar.title')}</CardTitle>
          <CardDescription>{t('calendar.description')}</CardDescription>
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label={t('calendar.prevMonth')}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <span className='min-w-32 text-center text-sm font-medium'>
            {formatMonthYear(month)}
          </span>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label={t('calendar.nextMonth')}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className='py-8 text-center text-sm text-destructive'>
            {t('calendar.loadError')}
          </p>
        ) : isLoading || !data ? (
          <Skeleton className='h-96 w-full rounded-md' />
        ) : (
          <div className='overflow-x-auto'>
            <div className='grid min-w-[640px] grid-cols-7 gap-1'>
              {weekdayLabels.map((label, index) => (
                <div
                  key={index}
                  className='px-1 text-center text-xs font-medium text-muted-foreground'
                >
                  {label}
                </div>
              ))}
              {gridDays.map((date) => (
                <ScheduleCalendarDay
                  key={date.toISOString()}
                  dateNumber={date.getDate()}
                  isCurrentMonth={isSameMonth(date, month)}
                  isToday={isToday(date)}
                  day={findDay(date)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
