import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { isPdfProofUrl } from '@/lib/payment-proof'
import { formatCurrencyIDR } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { PAYMENT_STATUS_BADGE_CLASS } from '@/features/dashboard/data/status'
import type { Payment } from '../data/types'

type BookingStatusPaymentHistoryProps = {
  payments: Payment[]
}

/** Riwayat pembayaran (DP/pelunasan) — halaman status booking publik (F06, Bagian 2). */
export function BookingStatusPaymentHistory({
  payments,
}: BookingStatusPaymentHistoryProps) {
  const { t } = useTranslation('bookingStatus')

  if (payments.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>{t('payments.empty')}</p>
    )
  }

  return (
    <ul className='space-y-3'>
      {payments.map((payment) => (
        <li key={payment.id} className='space-y-1.5 rounded-md border p-3 text-sm'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <Badge className={PAYMENT_STATUS_BADGE_CLASS[payment.status]}>
                {t(`payments.status.${payment.status}`)}
              </Badge>
              <span className='font-medium'>
                {t(`payments.tipe.${payment.tipe}`)}
              </span>
            </div>
            <span>{formatCurrencyIDR(payment.jumlah)}</span>
          </div>

          <p className='text-xs text-muted-foreground'>
            {formatDate(payment.createdAt, 'd MMM yyyy, HH:mm')}
          </p>

          {payment.buktiFotoUrl &&
            (isPdfProofUrl(payment.buktiFotoUrl) ? (
              <a
                href={payment.buktiFotoUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-block text-sm text-primary underline underline-offset-2'
              >
                {t('payments.viewPdf')}
              </a>
            ) : (
              <a href={payment.buktiFotoUrl} target='_blank' rel='noreferrer'>
                <img
                  src={payment.buktiFotoUrl}
                  alt={t('payments.proofAlt')}
                  className='h-20 w-20 rounded-md border object-cover'
                />
              </a>
            ))}

          {payment.status === 'REJECTED' && payment.catatanMua && (
            <p className='text-xs text-destructive'>
              {t('payments.rejectReason')}: {payment.catatanMua}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
