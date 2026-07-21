import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useCompleteOrder, useConfirmOrder } from '../hooks/use-orders'
import { OrderCancelDialog } from './order-cancel-dialog'
import { OrderDetailSheet } from './order-detail-sheet'
import { OrderRescheduleDialog } from './order-reschedule-dialog'
import { useOrders } from './orders-provider'

/**
 * Koordinator dialog fitur Order (F09). `OrderDetailSheet` dikendalikan oleh
 * `detailOpen` (state terpisah) supaya tetap terbuka selagi dialog aksi
 * (`actionOpen`) bertumpuk di atasnya — lihat catatan di orders-provider.tsx.
 */
export function OrdersDialogs() {
  const { t } = useTranslation('orders')
  const { currentRow, actionOpen, setActionOpen } = useOrders()
  const confirmMutation = useConfirmOrder()
  const completeMutation = useCompleteOrder()

  return (
    <>
      <OrderDetailSheet />

      {currentRow && (
        <>
          <ConfirmDialog
            key='order-confirm'
            open={actionOpen === 'confirm'}
            onOpenChange={(state) =>
              !confirmMutation.isPending &&
              setActionOpen(state ? 'confirm' : null)
            }
            title={t('confirmDialog.title')}
            desc={
              <>
                <p>{t('confirmDialog.desc', { kode: currentRow.kodeBooking })}</p>
                <p className='mt-2 text-xs text-muted-foreground'>
                  {t('confirmDialog.f06Note')}
                </p>
              </>
            }
            confirmText={t('actions.confirm')}
            isLoading={confirmMutation.isPending}
            handleConfirm={() => {
              confirmMutation.mutate(currentRow.id, {
                onSuccess: () => setActionOpen(null),
              })
            }}
          />

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
