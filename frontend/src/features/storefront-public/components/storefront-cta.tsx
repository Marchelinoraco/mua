import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useStorefrontDialogs } from './storefront-provider'

/** Tombol sticky-bottom di mobile — membuka form booking mandiri (F04). */
export function StorefrontBookingCta() {
  const { t } = useTranslation('storefront')
  const { setOpen } = useStorefrontDialogs()

  return (
    <div className='sticky bottom-0 z-10 border-t bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80'>
      <Button
        className='w-full bg-[var(--sf-primary)] text-white hover:bg-[var(--sf-primary)]/90'
        size='lg'
        onClick={() => setOpen('booking')}
      >
        {t('cta.booking')}
      </Button>
    </div>
  )
}
