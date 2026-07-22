import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { isPdfProofUrl } from '@/lib/payment-proof'
import { formatCurrencyIDR } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PAYMENT_STATUS_BADGE_CLASS } from '@/features/dashboard/data/status'
import type { Payment, PaymentTipe } from '@/features/dashboard/data/types'
import type { OrderDetail } from '../data/types'
import { useConfirmPayment } from '../hooks/use-payments'
import { OrderMarkCashDialog } from './order-mark-cash-dialog'
import { OrderPaymentRejectDialog } from './order-payment-reject-dialog'

type OrderPaymentSectionProps = {
  order: OrderDetail
}

/**
 * Seksi "Pembayaran" di Sheet detail order (F06, Bagian 3) — riwayat
 * pembayaran + aksi konfirmasi/tolak per bukti + "Tandai Bayar Tunai".
 * Dialog aksi dikelola LOKAL (state komponen ini), TERPISAH dari
 * `OrderActionDialogType` di orders-provider.tsx (yang lingkupnya per-order,
 * bukan per-payment) — lihat catatan keputusan di changelog F06.
 */
export function OrderPaymentSection({ order }: OrderPaymentSectionProps) {
  const { t } = useTranslation('orders')
  const [confirmTarget, setConfirmTarget] = useState<Payment | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Payment | null>(null)
  const [markCashOpen, setMarkCashOpen] = useState(false)
  const confirmMutation = useConfirmPayment()

  const markCashTipe: PaymentTipe | null =
    order.statusBooking === 'AWAITING_DP'
      ? 'DP'
      : order.statusBooking === 'CONFIRMED'
        ? 'PELUNASAN'
        : null
  const markCashDefaultJumlah =
    markCashTipe === 'DP' ? order.dpAmount : order.totalHarga - order.dpAmount

  return (
    <section className='space-y-2 rounded-md border p-3 text-sm'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='font-medium'>{t('payments.title')}</h3>
        {markCashTipe && (
          <Button
            size='sm'
            variant='outline'
            onClick={() => setMarkCashOpen(true)}
          >
            {t('payments.markCash.button')}
          </Button>
        )}
      </div>

      {order.payments.length === 0 ? (
        <p className='text-muted-foreground'>{t('payments.empty')}</p>
      ) : (
        <ul className='space-y-2'>
          {order.payments.map((payment) => (
            <li
              key={payment.id}
              className='space-y-1.5 rounded-md border p-2'
            >
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
                    className='inline-block text-primary underline underline-offset-2'
                  >
                    {t('payments.viewPdf')}
                  </a>
                ) : (
                  <a
                    href={payment.buktiFotoUrl}
                    target='_blank'
                    rel='noreferrer'
                  >
                    <img
                      src={payment.buktiFotoUrl}
                      alt={t('payments.proofAlt')}
                      className='h-20 w-20 rounded-md border object-cover'
                    />
                  </a>
                ))}

              {payment.catatanKlien && (
                <p className='text-xs text-muted-foreground'>
                  {t('payments.catatanKlien')}: {payment.catatanKlien}
                </p>
              )}

              {payment.status === 'REJECTED' && payment.catatanMua && (
                <p className='text-xs text-destructive'>
                  {t('payments.rejectReason')}: {payment.catatanMua}
                </p>
              )}
              {payment.status === 'CONFIRMED' && payment.catatanMua && (
                <p className='text-xs text-muted-foreground'>
                  {payment.catatanMua}
                </p>
              )}

              {payment.status === 'SUBMITTED' && (
                <div className='flex gap-2 pt-1'>
                  <Button size='sm' onClick={() => setConfirmTarget(payment)}>
                    {t('payments.actions.confirm')}
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => setRejectTarget(payment)}
                  >
                    {t('payments.actions.reject')}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(state) => {
          if (!confirmMutation.isPending && !state) setConfirmTarget(null)
        }}
        title={t('payments.confirmDialog.title')}
        desc={t('payments.confirmDialog.desc', {
          jumlah: confirmTarget ? formatCurrencyIDR(confirmTarget.jumlah) : '',
        })}
        confirmText={t('payments.actions.confirm')}
        isLoading={confirmMutation.isPending}
        handleConfirm={() => {
          if (!confirmTarget) return
          confirmMutation.mutate(
            { orderId: order.id, paymentId: confirmTarget.id },
            { onSuccess: () => setConfirmTarget(null) }
          )
        }}
      />

      <OrderPaymentRejectDialog
        orderId={order.id}
        payment={rejectTarget}
        onOpenChange={(state) => !state && setRejectTarget(null)}
      />

      <OrderMarkCashDialog
        orderId={order.id}
        open={markCashOpen}
        onOpenChange={setMarkCashOpen}
        tipe={markCashTipe}
        defaultJumlah={markCashDefaultJumlah}
      />
    </section>
  )
}
