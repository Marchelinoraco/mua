import { PauseCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type StorefrontInactiveProps = {
  namaBisnis: string
}

/** Tenant RESTRICTED (langganan past-due) — status nonaktif, bukan error. */
export function StorefrontInactive({ namaBisnis }: StorefrontInactiveProps) {
  const { t } = useTranslation('storefront')

  return (
    <div className='flex h-svh flex-col items-center justify-center gap-3 px-6 text-center'>
      <PauseCircle className='h-10 w-10 text-muted-foreground' />
      <h1 className='text-lg font-semibold'>{namaBisnis}</h1>
      <p className='max-w-sm text-sm text-muted-foreground'>
        {t('inactive.desc', { namaBisnis })}
      </p>
    </div>
  )
}
