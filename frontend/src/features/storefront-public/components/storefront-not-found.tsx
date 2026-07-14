import { Frown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** 404 ramah — tanpa menu dashboard, khusus untuk storefront publik. */
export function StorefrontNotFound() {
  const { t } = useTranslation('storefront')

  return (
    <div className='flex h-svh flex-col items-center justify-center gap-3 px-6 text-center'>
      <Frown className='h-10 w-10 text-muted-foreground' />
      <h1 className='text-lg font-semibold'>{t('notFound.title')}</h1>
      <p className='max-w-xs text-sm text-muted-foreground'>
        {t('notFound.desc')}
      </p>
    </div>
  )
}
