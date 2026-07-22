import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

type NonCustodialDisclaimerProps = {
  className?: string
}

/**
 * Disclaimer non-kustodi (FR-F06-9, RULE-1) — WAJIB tampil di setiap halaman
 * yang menampilkan instruksi pembayaran/unggah bukti klien->MUA. Dipisah
 * jadi komponen kecil supaya dipakai konsisten di beberapa tempat (halaman
 * status booking F06, form booking F04) tanpa duplikasi teks/style.
 */
export function NonCustodialDisclaimer({
  className,
}: NonCustodialDisclaimerProps) {
  const { t } = useTranslation('common')

  return (
    <Alert
      className={cn(
        'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950',
        className
      )}
    >
      <ShieldCheck className='h-4 w-4 text-amber-600 dark:text-amber-400' />
      <AlertDescription className='text-amber-800 dark:text-amber-200'>
        {t('nonCustodialDisclaimer')}
      </AlertDescription>
    </Alert>
  )
}
