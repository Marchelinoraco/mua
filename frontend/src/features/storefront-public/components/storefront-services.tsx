import { Car } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrencyIDR } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { StorefrontService } from '../data/types'

type StorefrontServicesProps = {
  services: StorefrontService[]
}

function DpBadge({ service }: { service: StorefrontService }) {
  const { t } = useTranslation('storefront')
  const nilai =
    service.dpTipe === 'PERSEN'
      ? `${service.dpNilai}%`
      : formatCurrencyIDR(service.dpNilai)
  return (
    <Badge
      variant='outline'
      className='border-[var(--sf-primary)] text-[var(--sf-primary)]'
    >
      {t('services.dpLabel', { nilai })}
    </Badge>
  )
}

export function StorefrontServices({ services }: StorefrontServicesProps) {
  const { t } = useTranslation('storefront')

  return (
    <section className='px-4 py-6 sm:px-6'>
      <h2 className='mb-3 text-lg font-semibold'>{t('services.title')}</h2>
      {services.length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('services.empty')}</p>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2'>
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className='flex flex-col gap-2 p-4'>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='font-medium'>{service.nama}</p>
                    {service.deskripsi && (
                      <p className='mt-0.5 text-sm text-muted-foreground'>
                        {service.deskripsi}
                      </p>
                    )}
                  </div>
                  <Badge variant='secondary' className='shrink-0'>
                    {t(`tipeOptions.${service.tipe}`)}
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'>
                  <span>
                    {t('services.durasiValue', { count: service.durasi })}
                  </span>
                  {service.butuhTransport && (
                    <span className='inline-flex items-center gap-1'>
                      <Car className='h-3.5 w-3.5' />
                      {t('services.butuhTransport')}
                    </span>
                  )}
                </div>
                <div className='mt-1 flex items-center justify-between gap-2'>
                  <span className='text-lg font-semibold text-[var(--sf-primary)]'>
                    {formatCurrencyIDR(service.harga)}
                  </span>
                  <DpBadge service={service} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
