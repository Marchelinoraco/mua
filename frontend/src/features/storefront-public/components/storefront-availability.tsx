import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { menitKeHHmm } from '@/lib/time'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/date-picker'
import { useStorefrontSlots } from '../hooks/use-storefront-slots'

type StorefrontAvailabilityPreviewProps = {
  slug: string
}

function toApiDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Tidak boleh cek ketersediaan untuk tanggal yang sudah lewat. */
const notPast = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Preview read-only ketersediaan slot — BUKAN alur booking (F04 belum ada).
 * Hanya menampilkan chip jam yang masih tersedia untuk tanggal terpilih.
 */
export function StorefrontAvailabilityPreview({
  slug,
}: StorefrontAvailabilityPreviewProps) {
  const { t } = useTranslation('storefront')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const apiDate = selectedDate ? toApiDate(selectedDate) : undefined
  const { data, isLoading, isFetching, isError } = useStorefrontSlots(
    slug,
    apiDate
  )

  const availableSlots = (data?.slots ?? []).filter((slot) => slot.tersedia)
  const showLoading = Boolean(selectedDate) && (isLoading || isFetching)

  return (
    <section className='px-4 py-6 sm:px-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('availability.title')}</CardTitle>
          <CardDescription>{t('availability.desc')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <DatePicker
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={notPast}
            placeholder={t('availability.pilihTanggal')}
            className='w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground sm:w-60'
          />

          {!selectedDate && (
            <p className='text-sm text-muted-foreground'>
              {t('availability.hint')}
            </p>
          )}

          {showLoading && (
            <div className='flex flex-wrap gap-2'>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className='h-7 w-20 rounded-full' />
              ))}
            </div>
          )}

          {selectedDate && !showLoading && isError && (
            <p className='text-sm text-destructive'>
              {t('availability.loadError')}
            </p>
          )}

          {selectedDate &&
            !showLoading &&
            !isError &&
            (availableSlots.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                {t('availability.empty')}
              </p>
            ) : (
              <div className='flex flex-wrap gap-2'>
                {availableSlots.map((slot) => (
                  <Badge
                    key={`${slot.jamMulai}-${slot.jamSelesai}`}
                    variant='outline'
                    className='border-[var(--sf-primary)] text-[var(--sf-primary)]'
                  >
                    {menitKeHHmm(slot.jamMulai)}–{menitKeHHmm(slot.jamSelesai)}
                  </Badge>
                ))}
              </div>
            ))}
        </CardContent>
      </Card>
    </section>
  )
}
