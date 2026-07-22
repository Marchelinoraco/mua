import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import type { Payment } from '@/features/dashboard/data/types'
import {
  rejectPaymentFormSchema,
  type RejectPaymentFormInput,
  type RejectPaymentFormValues,
} from '../data/schema'
import { useRejectPayment } from '../hooks/use-payments'

type OrderPaymentRejectDialogProps = {
  orderId: string
  payment: Payment | null
  onOpenChange: (open: boolean) => void
}

/** Dialog tolak bukti pembayaran (F06, FR-F06-5) — alasan wajib 5-500 karakter. */
export function OrderPaymentRejectDialog({
  orderId,
  payment,
  onOpenChange,
}: OrderPaymentRejectDialogProps) {
  const { t } = useTranslation('orders')
  const rejectMutation = useRejectPayment()
  const open = payment !== null

  const form = useForm<RejectPaymentFormInput, unknown, RejectPaymentFormValues>({
    resolver: zodResolver(rejectPaymentFormSchema),
    defaultValues: { alasan: '' },
  })

  useEffect(() => {
    if (open) form.reset({ alasan: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(values: RejectPaymentFormValues) {
    if (!payment) return
    rejectMutation.mutate(
      { orderId, paymentId: payment.id, alasan: values.alasan },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!rejectMutation.isPending) onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{t('payments.rejectDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('payments.rejectDialog.desc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='order-payment-reject-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='alasan'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.rejectDialog.alasan')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('payments.rejectDialog.alasanPlaceholder')}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant='outline'
            type='button'
            disabled={rejectMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('payments.rejectDialog.tutup')}
          </Button>
          <Button
            type='submit'
            form='order-payment-reject-form'
            variant='destructive'
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('payments.rejectDialog.saving')}
              </>
            ) : (
              t('payments.rejectDialog.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
