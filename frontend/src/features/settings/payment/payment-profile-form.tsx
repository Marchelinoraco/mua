import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NonCustodialDisclaimer } from '@/components/non-custodial-disclaimer'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  paymentProfileSchema,
  type PaymentProfileFormValues,
} from '@/features/onboarding/data/schema'
import {
  usePaymentProfile,
  useUpdatePaymentProfile,
} from './hooks/use-payment-profile'

const EMPTY_VALUES: PaymentProfileFormValues = {
  namaBank: '',
  nomorRekening: '',
  namaPemilik: '',
  instruksiTambahan: '',
}

/**
 * Form edit `PaymentProfile` — dipakai di `/settings/payment` (F06, Bagian
 * 1). Berbeda dari `OnboardingPaymentStep` (create-only saat setup awal):
 * halaman ini memuat data existing (`GET /payment-profile`) lalu
 * mengizinkan edit kapan saja. Skema/tipe form DI-REUSE dari onboarding —
 * lihat catatan di `data/types.ts`.
 */
export function PaymentProfileForm() {
  const { t } = useTranslation(['settings', 'auth', 'common'])
  const { data, isLoading, isError } = usePaymentProfile()
  const updateMutation = useUpdatePaymentProfile()

  const form = useForm<PaymentProfileFormValues>({
    resolver: zodResolver(paymentProfileSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!isLoading) {
      form.reset(
        data
          ? {
              namaBank: data.namaBank,
              nomorRekening: data.nomorRekening,
              namaPemilik: data.namaPemilik,
              instruksiTambahan: data.instruksiTambahan ?? '',
            }
          : EMPTY_VALUES
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isLoading])

  function onSubmit(values: PaymentProfileFormValues) {
    updateMutation.mutate(values)
  }

  if (isError) {
    return (
      <p className='py-8 text-center text-sm text-destructive'>
        {t('payment.loadError')}
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className='space-y-3'>
        <Skeleton className='h-9 w-full rounded-md' />
        <Skeleton className='h-9 w-full rounded-md' />
        <Skeleton className='h-9 w-full rounded-md' />
        <Skeleton className='h-20 w-full rounded-md' />
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <NonCustodialDisclaimer />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='namaBank'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth:onboarding.step2.namaBank')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('auth:onboarding.step2.namaBankPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='nomorRekening'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('auth:onboarding.step2.nomorRekening')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      'auth:onboarding.step2.nomorRekeningPlaceholder'
                    )}
                    inputMode='numeric'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='namaPemilik'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth:onboarding.step2.namaPemilik')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      'auth:onboarding.step2.namaPemilikPlaceholder'
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='instruksiTambahan'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('auth:onboarding.step2.instruksiTambahan')}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t(
                      'auth:onboarding.step2.instruksiTambahanPlaceholder'
                    )}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('auth:onboarding.step2.saving')}
              </>
            ) : (
              t('common:save')
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
