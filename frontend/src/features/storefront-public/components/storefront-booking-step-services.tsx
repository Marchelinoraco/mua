import { useTranslation } from 'react-i18next'
import { cn, formatCurrencyIDR } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { StorefrontService, StorefrontTransport } from '../data/types'
import type { BookingEstimate } from '../lib/booking-pricing'

type StorefrontBookingStepServicesProps = {
  services: StorefrontService[]
  transport: StorefrontTransport | null
  selectedServiceIds: string[]
  onToggleService: (id: string) => void
  zonaNama: string | undefined
  onZonaChange: (value: string) => void
  estimate: BookingEstimate
  /** `true` bila service butuhTransport terpilih + mode ZONA + zona tersedia, tapi belum dipilih. */
  zonaRequired: boolean
}

export function StorefrontBookingStepServices({
  services,
  transport,
  selectedServiceIds,
  onToggleService,
  zonaNama,
  onZonaChange,
  estimate,
  zonaRequired,
}: StorefrontBookingStepServicesProps) {
  const { t } = useTranslation('storefront')

  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium'>{t('booking.servicesStep.title')}</h3>

      {services.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('booking.servicesStep.empty')}
        </p>
      ) : (
        <div className='space-y-2'>
          {services.map((service) => {
            const checked = selectedServiceIds.includes(service.id)
            return (
              <label
                key={service.id}
                htmlFor={`booking-service-${service.id}`}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  checked
                    ? 'border-[var(--sf-primary)] bg-[var(--sf-primary)]/5'
                    : 'border-border'
                )}
              >
                <Checkbox
                  id={`booking-service-${service.id}`}
                  checked={checked}
                  onCheckedChange={() => onToggleService(service.id)}
                  className='mt-0.5'
                />
                <span className='flex-1 space-y-0.5'>
                  <span className='flex items-start justify-between gap-2'>
                    <span className='font-medium'>{service.nama}</span>
                    <span className='shrink-0 font-semibold text-[var(--sf-primary)]'>
                      {formatCurrencyIDR(service.harga)}
                    </span>
                  </span>
                  <span className='block text-xs text-muted-foreground'>
                    {t('services.durasiValue', { count: service.durasi })}
                    {service.butuhTransport &&
                      ` · ${t('services.butuhTransport')}`}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      )}

      {estimate.requiresTransport && transport?.mode === 'ZONA' && (
        <div className='space-y-2 rounded-lg border p-3'>
          <p className='text-sm font-medium'>
            {t('booking.servicesStep.transportZone')}
          </p>
          {(transport.zona ?? []).length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('booking.servicesStep.transportZoneEmpty')}
            </p>
          ) : (
            <RadioGroup value={zonaNama} onValueChange={onZonaChange}>
              {(transport.zona ?? []).map((zona) => (
                <Label
                  key={zona.nama}
                  htmlFor={`booking-zona-${zona.nama}`}
                  className='flex cursor-pointer items-center justify-between gap-2 rounded-md border p-2 font-normal'
                >
                  <span className='flex items-center gap-2'>
                    <RadioGroupItem
                      id={`booking-zona-${zona.nama}`}
                      value={zona.nama}
                    />
                    {zona.nama}
                  </span>
                  <span className='text-muted-foreground'>
                    {formatCurrencyIDR(zona.nominal)}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          )}
          {zonaRequired && (
            <p className='text-sm text-destructive'>
              {t('booking.servicesStep.validationZone')}
            </p>
          )}
        </div>
      )}

      {estimate.requiresTransport && transport?.mode === 'FLAT' && (
        <p className='text-sm text-muted-foreground'>
          {t('transport.flatDesc', {
            nominal: formatCurrencyIDR(transport.flatNominal ?? 0),
          })}
        </p>
      )}

      {selectedServiceIds.length > 0 && (
        <div className='space-y-1 rounded-lg border bg-muted/40 p-3 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>
              {t('booking.servicesStep.subtotal')}
            </span>
            <span>{formatCurrencyIDR(estimate.subtotal)}</span>
          </div>
          {estimate.requiresTransport && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>
                {t('booking.servicesStep.transportFlat')}
              </span>
              <span>{formatCurrencyIDR(estimate.transportFee)}</span>
            </div>
          )}
          <div className='flex justify-between font-medium'>
            <span>{t('booking.servicesStep.total')}</span>
            <span>{formatCurrencyIDR(estimate.total)}</span>
          </div>
          <div className='flex justify-between text-[var(--sf-primary)]'>
            <span>{t('booking.servicesStep.dpEstimate')}</span>
            <span>{formatCurrencyIDR(estimate.dpAmount)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
