import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { toNaiveLocalDate } from '@/lib/naive-datetime'
import { formatCurrencyIDR } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { BOOKING_STATUS_BADGE_CLASS } from '@/features/dashboard/data/status'
import type { BookingStatus } from '../data/types'
import { useOrderDetail } from '../hooks/use-orders'
import { OrderPaymentSection } from './order-payment-section'
import { useOrders } from './orders-provider'

const ACTIONABLE_STATUSES: BookingStatus[] = ['AWAITING_DP', 'CONFIRMED', 'PAID']

function DetailSkeleton() {
  return (
    <div className='space-y-4 px-4'>
      <Skeleton className='h-20 w-full rounded-md' />
      <Skeleton className='h-32 w-full rounded-md' />
      <Skeleton className='h-24 w-full rounded-md' />
    </div>
  )
}

export function OrderDetailSheet() {
  const { t } = useTranslation('orders')
  const { detailOpen, setDetailOpen, currentRow, setCurrentRow, setActionOpen } =
    useOrders()
  const { data, isLoading, isError } = useOrderDetail(currentRow?.id)

  function handleOpenChange(open: boolean) {
    setDetailOpen(open)
    if (!open) {
      setActionOpen(null)
      setTimeout(() => setCurrentRow(null), 300)
    }
  }

  if (!currentRow) return null

  const status = data?.statusBooking ?? currentRow.statusBooking
  const canAct = ACTIONABLE_STATUSES.includes(status)

  return (
    <Sheet open={detailOpen} onOpenChange={handleOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 sm:max-w-lg'>
        <SheetHeader className='text-start'>
          <SheetTitle>{currentRow.kodeBooking}</SheetTitle>
          <SheetDescription>
            {formatDate(
              toNaiveLocalDate(data?.tanggalAcara ?? currentRow.tanggalAcara),
              'EEEE, d MMMM yyyy, HH:mm'
            )}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-4 py-4'>
          <Badge className={BOOKING_STATUS_BADGE_CLASS[status]}>
            {t(`status.${status}`)}
          </Badge>

          {isError && (
            <p className='text-sm text-destructive'>{t('detail.loadError')}</p>
          )}

          {isLoading || !data ? (
            <DetailSkeleton />
          ) : (
            <>
              {/* Klien */}
              <section className='space-y-1 rounded-md border p-3 text-sm'>
                <h3 className='font-medium'>{t('detail.klien')}</h3>
                <div className='flex justify-between gap-2'>
                  <span className='text-muted-foreground'>
                    {t('detail.nama')}
                  </span>
                  <span>{data.client.nama}</span>
                </div>
                <div className='flex justify-between gap-2'>
                  <span className='text-muted-foreground'>
                    {t('detail.phone')}
                  </span>
                  <span>{data.client.phone}</span>
                </div>
                {data.client.email && (
                  <div className='flex justify-between gap-2'>
                    <span className='text-muted-foreground'>
                      {t('detail.email')}
                    </span>
                    <span>{data.client.email}</span>
                  </div>
                )}
                {data.client.catatan && (
                  <div className='flex justify-between gap-2'>
                    <span className='shrink-0 text-muted-foreground'>
                      {t('detail.catatanKlien')}
                    </span>
                    <span className='text-end'>{data.client.catatan}</span>
                  </div>
                )}
              </section>

              {/* Layanan & biaya */}
              <section className='space-y-2 rounded-md border p-3 text-sm'>
                <h3 className='font-medium'>{t('detail.layanan')}</h3>
                <ul className='space-y-1'>
                  {data.items.map((item, index) => (
                    <li key={index} className='flex justify-between gap-2'>
                      <span>
                        {item.namaSnapshot}
                        {item.qty > 1 ? ` × ${item.qty}` : ''}
                      </span>
                      <span>{formatCurrencyIDR(item.hargaSnapshot)}</span>
                    </li>
                  ))}
                </ul>
                <Separator />
                <div className='flex justify-between font-medium'>
                  <span>{t('detail.total')}</span>
                  <span>{formatCurrencyIDR(data.totalHarga)}</span>
                </div>
                <div className='flex justify-between text-primary'>
                  <span>{t('detail.dp')}</span>
                  <span>{formatCurrencyIDR(data.dpAmount)}</span>
                </div>
              </section>

              {/* Custom values */}
              {data.customValues.length > 0 && (
                <section className='space-y-1 rounded-md border p-3 text-sm'>
                  <h3 className='font-medium'>{t('detail.customValues')}</h3>
                  {data.customValues.map((cv) => (
                    <div
                      key={cv.customFieldId}
                      className='flex justify-between gap-2'
                    >
                      <span className='shrink-0 text-muted-foreground'>
                        {cv.label}
                      </span>
                      <span className='text-end'>{cv.nilai}</span>
                    </div>
                  ))}
                </section>
              )}

              {/* Lokasi & catatan */}
              {(data.lokasiAcara || data.catatan) && (
                <section className='space-y-1 rounded-md border p-3 text-sm'>
                  {data.lokasiAcara && (
                    <div className='flex justify-between gap-2'>
                      <span className='shrink-0 text-muted-foreground'>
                        {t('detail.lokasi')}
                      </span>
                      <span className='text-end'>{data.lokasiAcara}</span>
                    </div>
                  )}
                  {data.catatan && (
                    <div className='flex justify-between gap-2'>
                      <span className='shrink-0 text-muted-foreground'>
                        {t('detail.catatan')}
                      </span>
                      <span className='text-end'>{data.catatan}</span>
                    </div>
                  )}
                </section>
              )}

              {/* Pembatalan */}
              {status === 'CANCELED' && (data.alasanBatal || data.canceledAt) && (
                <section className='space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm'>
                  <h3 className='font-medium text-destructive'>
                    {t('detail.pembatalan')}
                  </h3>
                  {data.canceledAt && (
                    <div className='flex justify-between gap-2'>
                      <span className='text-muted-foreground'>
                        {t('detail.canceledAt')}
                      </span>
                      <span>{formatDate(data.canceledAt, 'd MMM yyyy HH:mm')}</span>
                    </div>
                  )}
                  {data.alasanBatal && (
                    <div className='flex justify-between gap-2'>
                      <span className='shrink-0 text-muted-foreground'>
                        {t('detail.alasanBatal')}
                      </span>
                      <span className='text-end'>{data.alasanBatal}</span>
                    </div>
                  )}
                </section>
              )}

              {/* Pembayaran (F06) */}
              <OrderPaymentSection order={data} />
            </>
          )}
        </div>

        {canAct && data && (
          <div className='flex flex-wrap gap-2 border-t p-4'>
            {(status === 'CONFIRMED' || status === 'PAID') && (
              <Button size='sm' onClick={() => setActionOpen('complete')}>
                {t('actions.complete')}
              </Button>
            )}
            <Button
              size='sm'
              variant='outline'
              onClick={() => setActionOpen('reschedule')}
            >
              {t('actions.reschedule')}
            </Button>
            <Button
              size='sm'
              variant='destructive'
              onClick={() => setActionOpen('cancel')}
            >
              {t('actions.cancel')}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
