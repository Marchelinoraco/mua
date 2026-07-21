import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { menitKeHHmm } from '@/lib/time'
import { formatCurrencyIDR } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import type { BookingDetailsFormValues } from '../data/schema'
import type { StorefrontCustomField } from '../data/types'
import type { BookingEstimate } from '../lib/booking-pricing'
import { formatCustomFieldValue } from '../lib/custom-fields'

type StorefrontBookingStepSummaryProps = {
  estimate: BookingEstimate
  selectedDate: Date | undefined
  jamMulai: number | undefined
  zonaNama: string | undefined
  details: BookingDetailsFormValues
  customFields: StorefrontCustomField[]
}

export function StorefrontBookingStepSummary({
  estimate,
  selectedDate,
  jamMulai,
  zonaNama,
  details,
  customFields,
}: StorefrontBookingStepSummaryProps) {
  const { t } = useTranslation(['storefront', 'common'])
  const booleanLabels = { ya: t('common:yes'), tidak: t('common:no') }
  const filledCustomFields = customFields.filter(
    (field) => field.tipe !== 'file' && details.customValues?.[field.id]
  )

  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium'>{t('booking.summaryStep.title')}</h3>

      <div className='space-y-3 rounded-lg border p-3 text-sm'>
        <div>
          <p className='text-muted-foreground'>
            {t('booking.summaryStep.layanan')}
          </p>
          <ul className='mt-1 space-y-1'>
            {estimate.selectedServices.map((service) => (
              <li key={service.id} className='flex justify-between gap-2'>
                <span>{service.nama}</span>
                <span>{formatCurrencyIDR(service.harga)}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div className='flex justify-between'>
          <span className='text-muted-foreground'>
            {t('booking.summaryStep.tanggalJam')}
          </span>
          <span className='text-end'>
            {selectedDate ? formatDate(selectedDate, 'EEEE, d MMMM yyyy') : '-'}
            {jamMulai !== undefined && `, ${menitKeHHmm(jamMulai)}`}
          </span>
        </div>

        {zonaNama && (
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>{t('transport.zona')}</span>
            <span>{zonaNama}</span>
          </div>
        )}

        <div className='flex justify-between'>
          <span className='text-muted-foreground'>
            {t('booking.summaryStep.kontak')}
          </span>
          <span className='text-end'>
            {details.nama}
            <br />
            {details.phone}
          </span>
        </div>

        {details.lokasiAcara && (
          <div className='flex justify-between gap-2'>
            <span className='shrink-0 text-muted-foreground'>
              {t('booking.summaryStep.lokasi')}
            </span>
            <span className='text-end'>{details.lokasiAcara}</span>
          </div>
        )}

        {details.catatan && (
          <div className='flex justify-between gap-2'>
            <span className='shrink-0 text-muted-foreground'>
              {t('booking.summaryStep.catatan')}
            </span>
            <span className='text-end'>{details.catatan}</span>
          </div>
        )}

        {filledCustomFields.length > 0 && (
          <div>
            <p className='text-muted-foreground'>
              {t('booking.summaryStep.infoTambahan')}
            </p>
            <ul className='mt-1 space-y-1'>
              {filledCustomFields.map((field) => (
                <li key={field.id} className='flex justify-between gap-2'>
                  <span className='shrink-0 text-muted-foreground'>
                    {field.label}
                  </span>
                  <span className='text-end'>
                    {formatCustomFieldValue(
                      field,
                      details.customValues[field.id],
                      booleanLabels
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        <div className='flex justify-between'>
          <span className='text-muted-foreground'>
            {t('booking.summaryStep.subtotal')}
          </span>
          <span>{formatCurrencyIDR(estimate.subtotal)}</span>
        </div>
        {estimate.requiresTransport && (
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>
              {t('booking.summaryStep.transport')}
            </span>
            <span>{formatCurrencyIDR(estimate.transportFee)}</span>
          </div>
        )}
        <div className='flex justify-between font-medium'>
          <span>{t('booking.summaryStep.total')}</span>
          <span>{formatCurrencyIDR(estimate.total)}</span>
        </div>
        <div className='flex justify-between text-base font-semibold text-[var(--sf-primary)]'>
          <span>{t('booking.summaryStep.dp')}</span>
          <span>{formatCurrencyIDR(estimate.dpAmount)}</span>
        </div>
      </div>

      <p className='text-xs text-muted-foreground'>
        {t('booking.summaryStep.dpNote')}
      </p>
    </div>
  )
}
