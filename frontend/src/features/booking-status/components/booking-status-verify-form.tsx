import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { toNaiveLocalDate } from '@/lib/naive-datetime'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { BOOKING_STATUS_BADGE_CLASS } from '@/features/dashboard/data/status'
import {
  verifyPhoneFormSchema,
  type VerifyPhoneFormInput,
  type VerifyPhoneFormValues,
} from '../data/schema'
import type { BookingStatusMinimal } from '../data/types'

type BookingStatusVerifyFormProps = {
  minimal: BookingStatusMinimal
  onVerify: (phone: string) => void
  isVerifying: boolean
  /** `true` bila nomor yang terakhir dikirim tidak cocok dengan data booking. */
  mismatch: boolean
}

/**
 * State awal halaman status booking — hanya info minimal (FR-F04-7, privasi)
 * + form verifikasi ringan nomor WA. BUKAN OTP asli (F08 belum ada, lihat
 * catatan di `use-booking-status.ts`) — disclaimer ditampilkan eksplisit.
 */
export function BookingStatusVerifyForm({
  minimal,
  onVerify,
  isVerifying,
  mismatch,
}: BookingStatusVerifyFormProps) {
  const { t } = useTranslation('bookingStatus')

  const form = useForm<VerifyPhoneFormInput, unknown, VerifyPhoneFormValues>({
    resolver: zodResolver(verifyPhoneFormSchema),
    defaultValues: { phone: '' },
  })

  function onSubmit(values: VerifyPhoneFormValues) {
    onVerify(values.phone)
  }

  return (
    <div className='mx-auto max-w-xl space-y-4 px-4 py-8 sm:px-6'>
      <Card>
        <CardHeader>
          <CardTitle>{minimal.kodeBooking}</CardTitle>
          <CardDescription>
            {formatDate(
              toNaiveLocalDate(minimal.tanggalAcara),
              'EEEE, d MMMM yyyy'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge className={BOOKING_STATUS_BADGE_CLASS[minimal.statusBooking]}>
            {t(`status.${minimal.statusBooking}`)}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('verify.title')}</CardTitle>
          <CardDescription>{t('verify.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('verify.phoneLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type='tel'
                        inputMode='tel'
                        placeholder={t('verify.phonePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mismatch && (
                <p className='text-sm text-destructive'>
                  {t('verify.mismatch')}
                </p>
              )}
              <Button type='submit' className='w-full' disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <Loader2 className='animate-spin' />
                    {t('verify.submit')}
                  </>
                ) : (
                  t('verify.submit')
                )}
              </Button>
              <p className='text-center text-xs text-muted-foreground'>
                {t('verify.disclaimer')}
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
