import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatCurrencyIDR } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { PaymentTipe } from '@/features/dashboard/data/types'
import {
  paymentUploadFormSchema,
  type PaymentUploadFormInput,
  type PaymentUploadFormValues,
} from '../data/schema'
import {
  getPaymentUploadErrorMessage,
  isPaymentUploadConflictError,
  isPaymentUploadNotFoundError,
  isPaymentUploadThrottleError,
  useUploadPayment,
} from '../hooks/use-upload-payment'

type BookingStatusPaymentUploadFormProps = {
  kode: string
  phone: string
  tipe: PaymentTipe
  suggestedAmount: number
  isReupload: boolean
}

/** Form unggah bukti transfer DP/pelunasan (F06, Bagian 2, FR-F06-3). */
export function BookingStatusPaymentUploadForm({
  kode,
  phone,
  tipe,
  suggestedAmount,
  isReupload,
}: BookingStatusPaymentUploadFormProps) {
  const { t } = useTranslation('bookingStatus')
  const uploadMutation = useUploadPayment()

  const form = useForm<
    PaymentUploadFormInput,
    unknown,
    PaymentUploadFormValues
  >({
    resolver: zodResolver(paymentUploadFormSchema),
    defaultValues: { jumlah: suggestedAmount, catatanKlien: '' },
  })
  const fileRef = form.register('bukti')

  function onSubmit(values: PaymentUploadFormValues) {
    uploadMutation.mutate(
      {
        kode,
        phone,
        tipe,
        jumlah: values.jumlah,
        catatanKlien: values.catatanKlien,
        bukti: values.bukti[0],
      },
      {
        onSuccess: () => {
          toast.success(t('uploadForm.success'))
          form.reset({ jumlah: suggestedAmount, catatanKlien: '' })
        },
        onError: (error) => {
          if (isPaymentUploadNotFoundError(error)) {
            toast.error(t('uploadForm.errors.notFound'))
            return
          }
          if (isPaymentUploadConflictError(error)) {
            toast.error(
              getPaymentUploadErrorMessage(
                error,
                t('uploadForm.errors.conflict')
              )
            )
            return
          }
          if (isPaymentUploadThrottleError(error)) {
            toast.error(t('uploadForm.errors.throttle'))
            return
          }
          toast.error(
            getPaymentUploadErrorMessage(error, t('uploadForm.errors.generic'))
          )
        },
      }
    )
  }

  return (
    <div className='space-y-2'>
      <h3 className='text-sm font-medium'>
        {tipe === 'DP' ? t('uploadForm.titleDp') : t('uploadForm.titlePelunasan')}
      </h3>
      {isReupload && (
        <p className='text-xs text-amber-600 dark:text-amber-400'>
          {t('uploadForm.reuploadNote')}
        </p>
      )}
      <p className='text-xs text-muted-foreground'>
        {t('uploadForm.suggestedAmount', {
          jumlah: formatCurrencyIDR(suggestedAmount),
        })}
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
          <FormField
            control={form.control}
            name='jumlah'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('uploadForm.amountLabel')}</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={1}
                    inputMode='numeric'
                    {...field}
                    value={field.value as number}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='bukti'
            render={() => (
              <FormItem>
                <FormLabel>{t('uploadForm.fileLabel')}</FormLabel>
                <FormControl>
                  <Input
                    type='file'
                    accept='image/*,application/pdf'
                    {...fileRef}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='catatanKlien'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('uploadForm.catatanLabel')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('uploadForm.catatanPlaceholder')}
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type='submit'
            className='w-full'
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('uploadForm.submitting')}
              </>
            ) : (
              t('uploadForm.submit')
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
