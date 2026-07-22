import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useCompleteOrder } from '../hooks/use-orders'
import { OrderCancelDialog } from './order-cancel-dialog'
import { OrderDetailSheet } from './order-detail-sheet'
import { OrderRescheduleDialog } from './order-reschedule-dialog'
import { useOrders } from './orders-provider'

/**
 * Koordinator dialog fitur Order (F09). `OrderDetailSheet` dikendalikan oleh
 * `detailOpen` (state terpisah) supaya tetap terbuka selagi dialog aksi
 * (`actionOpen`) bertumpuk di atasnya — lihat catatan di orders-provider.tsx.
 * Aksi konfirmasi order (AWAITING_DP -> CONFIRMED) TIDAK lagi di sini — F06
 * menggantikannya dengan aksi per-Payment (konfirmasi bukti/tandai tunai) di
 * `OrderPaymentSection`, supaya setiap transisi status booking punya jejak
 * audit (FR-F06-8).
 */
export function OrdersDialogs() {
  const { t } = useTranslation('orders')
  const { currentRow, actionOpen, setActionOpen } = useOrders()
  const completeMutation = useCompleteOrder()

  return (
    <>
      <OrderDetailSheet />

      {currentRow && (
        <>
          <ConfirmDialog
            key='order-complete'
            open={actionOpen === 'complete'}
            onOpenChange={(state) =>
              !completeMutation.isPending &&
              setActionOpen(state ? 'complete' : null)
            }
            title={t('completeDialog.title')}
            desc={t('completeDialog.desc', { kode: currentRow.kodeBooking })}
            confirmText={t('actions.complete')}
            isLoading={completeMutation.isPending}
            handleConfirm={() => {
              completeMutation.mutate(currentRow.id, {
                onSuccess: () => setActionOpen(null),
              })
            }}
          />

          <OrderCancelDialog key='order-cancel' />
          <OrderRescheduleDialog key='order-reschedule' />
        </>
      )}
    </>
  )
}
