import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import {
  paymentProfileSchema,
  type PaymentProfileFormValues,
} from '../data/schema'

interface OnboardingPaymentStepProps {
  onSuccess: () => void
}

export function OnboardingPaymentStep({ onSuccess }: OnboardingPaymentStepProps) {
  const { t } = useTranslation('auth')
  const queryClient = useQueryClient()

  const form = useForm<PaymentProfileFormValues>({
    resolver: zodResolver(paymentProfileSchema),
    defaultValues: {
      namaBank: '',
      nomorRekening: '',
      namaPemilik: '',
      instruksiTambahan: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: PaymentProfileFormValues) =>
      api.put('/payment-profile', values).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding', 'checklist'] })
      toast.success(t('onboarding.step2.saved'))
      onSuccess()
    },
    onError: (err: unknown) => {
      handleServerError(err)
    },
  })

  function onSubmit(values: PaymentProfileFormValues) {
    mutation.mutate(values)
  }

  return (
    <div className='space-y-4'>
      {/* Disclaimer — dana tidak melewati GlowBook */}
      <Alert className='border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'>
        <ShieldCheck className='h-4 w-4 text-amber-600 dark:text-amber-400' />
        <AlertDescription className='text-amber-800 dark:text-amber-200'>
          {t('onboarding.step2.disclaimer')}
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3'>
          <FormField
            control={form.control}
            name='namaBank'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('onboarding.step2.namaBank')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('onboarding.step2.namaBankPlaceholder')}
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
                <FormLabel>{t('onboarding.step2.nomorRekening')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      'onboarding.step2.nomorRekeningPlaceholder'
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
                <FormLabel>{t('onboarding.step2.namaPemilik')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('onboarding.step2.namaPemilikPlaceholder')}
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
                  {t('onboarding.step2.instruksiTambahan')}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t(
                      'onboarding.step2.instruksiTambahanPlaceholder'
                    )}
                    rows={3}
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('onboarding.step2.saving')}
              </>
            ) : (
              t('onboarding.step2.saveButton')
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
