import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Fallback untuk error non-404 (5xx/jaringan) — bukan bagian dari kontrak F02
 *  eksplisit, tapi wajib agar halaman publik tak pernah menampilkan layar putih. */
export function StorefrontLoadError() {
  const { t } = useTranslation('storefront')

  return (
    <div className='flex h-svh flex-col items-center justify-center gap-3 px-6 text-center'>
      <AlertTriangle className='h-10 w-10 text-destructive' />
      <h1 className='text-lg font-semibold'>{t('loadError.title')}</h1>
      <p className='max-w-xs text-sm text-muted-foreground'>
        {t('loadError.desc')}
      </p>
    </div>
  )
}
