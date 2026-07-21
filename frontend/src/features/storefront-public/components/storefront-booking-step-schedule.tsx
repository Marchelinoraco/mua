import { useTranslation } from 'react-i18next'
import { menitKeHHmm } from '@/lib/time'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/date-picker'
import { useStorefrontSlots } from '../hooks/use-storefront-slots'
import { isPastDate, toApiDateString } from '../lib/slot-date'
import { isSlotLongEnough } from '../lib/slot-fit'

type StorefrontBookingStepScheduleProps = {
  slug: string
  durasiTotal: number
  selectedDate: Date | undefined
  onSelectDate: (date: Date | undefined) => void
  jamMulai: number | undefined
  onSelectSlot: (jamMulai: number) => void
}

export function StorefrontBookingStepSchedule({
  slug,
  durasiTotal,
  selectedDate,
  onSelectDate,
  jamMulai,
  onSelectSlot,
}: StorefrontBookingStepScheduleProps) {
  const { t } = useTranslation('storefront')
  const apiDate = selectedDate ? toApiDateString(selectedDate) : undefined
  const { data, isLoading, isFetching, isError } = useStorefrontSlots(
    slug,
    apiDate
  )

  const availableSlots = (data?.slots ?? []).filter((slot) => slot.tersedia)
  const showLoading = Boolean(selectedDate) && (isLoading || isFetching)

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-sm font-medium'>
          {t('booking.scheduleStep.title')}
        </h3>
        {durasiTotal > 0 && (
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {t('booking.scheduleStep.durasiInfo', { durasi: durasiTotal })}
          </p>
        )}
      </div>

      <DatePicker
        selected={selectedDate}
        onSelect={onSelectDate}
        disabled={isPastDate}
        placeholder={t('availability.pilihTanggal')}
        className='w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
      />

      {!selectedDate && (
        <p className='text-sm text-muted-foreground'>
          {t('booking.scheduleStep.hint')}
        </p>
      )}

      {showLoading && (
        <div className='flex flex-wrap gap-2'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-9 w-24 rounded-full' />
          ))}
        </div>
      )}

      {selectedDate && !showLoading && isError && (
        <p className='text-sm text-destructive'>
          {t('booking.scheduleStep.loadError')}
        </p>
      )}

      {selectedDate &&
        !showLoading &&
        !isError &&
        (availableSlots.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            {t('booking.scheduleStep.empty')}
          </p>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {availableSlots.map((slot) => {
              const selected = jamMulai === slot.jamMulai
              const recommended =
                durasiTotal > 0 &&
                isSlotLongEnough(data?.slots ?? [], slot.jamMulai, durasiTotal)
              return (
                <button
                  key={`${slot.jamMulai}-${slot.jamSelesai}`}
                  type='button'
                  onClick={() => onSelectSlot(slot.jamMulai)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    selected
                      ? 'border-[var(--sf-primary)] bg-[var(--sf-primary)] text-white'
                      : recommended
                        ? 'border-[var(--sf-primary)] text-[var(--sf-primary)]'
                        : 'border-border text-foreground'
                  )}
                >
                  {menitKeHHmm(slot.jamMulai)}
                  {recommended && !selected && (
                    <Badge
                      variant='outline'
                      className='ms-1.5 border-none px-0 text-[10px] text-[var(--sf-primary)]'
                    >
                      {t('booking.scheduleStep.recommended')}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        ))}
    </div>
  )
}
