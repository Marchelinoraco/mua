import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type DataTableLoadingOverlayProps = {
  isLoading: boolean
}

/**
 * Renders a frosted-glass spinner overlay on top of the table when `isLoading` is true.
 * Place this inside the same `relative` container as the table border wrapper.
 */
export function DataTableLoadingOverlay({
  isLoading,
}: DataTableLoadingOverlayProps) {
  const { t } = useTranslation()

  if (!isLoading) return null

  return (
    <div
      role='status'
      aria-label={t('loading')}
      aria-live='polite'
      className='absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-sm'
    >
      <div className='flex flex-col items-center gap-2'>
        <Loader2
          className='size-8 animate-spin text-primary'
          aria-hidden='true'
        />
        <span className='text-sm text-muted-foreground'>{t('loading')}</span>
      </div>
    </div>
  )
}
