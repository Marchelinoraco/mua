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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { PaymentTipe } from '@/features/dashboard/data/types'
import {
  markCashPaymentFormSchema,
  type MarkCashPaymentFormInput,
  type MarkCashPaymentFormValues,
} from '../data/schema'
import { useMarkCashPayment } from '../hooks/use-payments'

type OrderMarkCashDialogProps = {
  orderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `null` bila status booking saat ini tidak mengizinkan tandai tunai (tombol pemanggil disembunyikan). */
  tipe: PaymentTipe | null
  defaultJumlah: number
}

/** Dialog "Tandai Bayar Tunai" (F06, FR-F06-7) — MUA mencatat pembayaran tunai tanpa bukti unggahan. */
export function OrderMarkCashDialog({
  orderId,
  open,
  onOpenChange,
  tipe,
  defaultJumlah,
}: OrderMarkCashDialogProps) {
  const { t } = useTranslation('orders')
  const markCashMutation = useMarkCashPayment()

  const form = useForm<
    MarkCashPaymentFormInput,
    unknown,
    MarkCashPaymentFormValues
  >({
    resolver: zodResolver(markCashPaymentFormSchema),
    defaultValues: { jumlah: defaultJumlah, catatanMua: '' },
  })

  useEffect(() => {
    if (open) form.reset({ jumlah: defaultJumlah, catatanMua: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultJumlah])

  function onSubmit(values: MarkCashPaymentFormValues) {
    if (!tipe) return
    markCashMutation.mutate(
      { orderId, tipe, jumlah: values.jumlah, catatanMua: values.catatanMua },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!markCashMutation.isPending) onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{t('payments.markCash.title')}</DialogTitle>
          <DialogDescription>
            {tipe
              ? t(`payments.markCash.desc.${tipe}`)
              : t('payments.markCash.descFallback')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='order-mark-cash-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='jumlah'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.markCash.jumlah')}</FormLabel>
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
              name='catatanMua'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('payments.markCash.catatan')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('payments.markCash.catatanPlaceholder')}
                      rows={3}
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
            disabled={markCashMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('payments.markCash.tutup')}
          </Button>
          <Button
            type='submit'
            form='order-mark-cash-form'
            disabled={markCashMutation.isPending || !tipe}
          >
            {markCashMutation.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('payments.markCash.saving')}
              </>
            ) : (
              t('payments.markCash.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
