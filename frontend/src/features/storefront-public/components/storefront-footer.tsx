import { useTranslation } from 'react-i18next'
import { useStorefrontDialogs } from './storefront-provider'

export function StorefrontFooter() {
  const { t } = useTranslation('storefront')
  const { setOpen } = useStorefrontDialogs()

  return (
    <footer className='px-4 py-6 text-center sm:px-6'>
      <button
        type='button'
        onClick={() => setOpen('report')}
        className='text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground'
      >
        {t('footer.report')}
      </button>
      <p className='mt-2 text-xs text-muted-foreground'>
        {t('footer.poweredBy')}
      </p>
    </footer>
  )
}
