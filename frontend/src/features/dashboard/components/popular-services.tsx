import { useTranslation } from 'react-i18next'
import type { PopularService } from '../data/types'

export function PopularServices({ services }: { services: PopularService[] }) {
  const { t } = useTranslation('dashboard')

  if (services.length === 0) {
    return (
      <p className='py-4 text-sm text-muted-foreground'>
        {t('popularServices.empty')}
      </p>
    )
  }

  const max = Math.max(...services.map((service) => service.bookingCount), 1)

  return (
    <ul className='space-y-3'>
      {services.map((service) => (
        <li key={service.id}>
          <div className='mb-1 flex items-center justify-between gap-2'>
            <span className='truncate text-sm font-medium'>
              {service.name}
            </span>
            <span className='shrink-0 text-xs text-muted-foreground'>
              {t('popularServices.count', { count: service.bookingCount })}
            </span>
          </div>
          <div className='h-2 w-full rounded-full bg-muted'>
            <div
              className='h-2 rounded-full bg-primary'
              style={{
                width: `${Math.round((service.bookingCount / max) * 100)}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
