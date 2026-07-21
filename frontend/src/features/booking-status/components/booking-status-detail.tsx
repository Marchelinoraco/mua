import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { toNaiveLocalDate } from '@/lib/naive-datetime'
import { formatCurrencyIDR } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BOOKING_STATUS_BADGE_CLASS } from '@/features/dashboard/data/status'
import type { BookingStatusDetail as BookingStatusDetailData } from '../data/types'

type BookingStatusDetailProps = {
  data: BookingStatusDetailData
}

/** Detail penuh booking — hanya ditampilkan setelah verifikasi nomor WA cocok. */
export function BookingStatusDetail({ data }: BookingStatusDetailProps) {
  const { t } = useTranslation('bookingStatus')

  return (
    <div className='mx-auto max-w-xl space-y-4 px-4 py-8 sm:px-6'>
      <Card>
        <CardHeader>
          <CardTitle>{data.kodeBooking}</CardTitle>
          <CardDescription>
            {formatDate(
              toNaiveLocalDate(data.tanggalAcara),
              'EEEE, d MMMM yyyy, HH:mm'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge className={BOOKING_STATUS_BADGE_CLASS[data.statusBooking]}>
            {t(`status.${data.statusBooking}`)}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('detail.layanan')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <ul className='space-y-1 text-sm'>
            {data.items.map((item, index) => (
              <li key={index} className='flex justify-between gap-2'>
                <span>{item.namaSnapshot}</span>
                <span>{formatCurrencyIDR(item.hargaSnapshot)}</span>
              </li>
            ))}
          </ul>

          <Separator />

          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>{t('detail.total')}</span>
            <span>{formatCurrencyIDR(data.totalHarga)}</span>
          </div>
          <div className='flex justify-between text-sm font-semibold text-primary'>
            <span>{t('detail.dp')}</span>
            <span>{formatCurrencyIDR(data.dpAmount)}</span>
          </div>

          {data.lokasiAcara && (
            <div className='flex justify-between gap-2 text-sm'>
              <span className='shrink-0 text-muted-foreground'>
                {t('detail.lokasi')}
              </span>
              <span className='text-end'>{data.lokasiAcara}</span>
            </div>
          )}

          {data.catatan && (
            <div className='flex justify-between gap-2 text-sm'>
              <span className='shrink-0 text-muted-foreground'>
                {t('detail.catatan')}
              </span>
              <span className='text-end'>{data.catatan}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('detail.payment.title')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-1 text-sm'>
          {data.paymentProfile ? (
            <>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  {t('detail.payment.bank')}
                </span>
                <span>{data.paymentProfile.namaBank}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  {t('detail.payment.noRek')}
                </span>
                <span className='font-mono'>
                  {data.paymentProfile.nomorRekening}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>
                  {t('detail.payment.pemilik')}
                </span>
                <span>{data.paymentProfile.namaPemilik}</span>
              </div>
              {data.paymentProfile.instruksiTambahan && (
                <p className='pt-1 text-xs text-muted-foreground'>
                  {data.paymentProfile.instruksiTambahan}
                </p>
              )}
            </>
          ) : (
            <p className='text-muted-foreground'>
              {t('detail.payment.missing')}
            </p>
          )}
        </CardContent>
      </Card>

      <p className='text-center text-xs text-muted-foreground'>
        {t('detail.otpNotice')}
      </p>
    </div>
  )
}
