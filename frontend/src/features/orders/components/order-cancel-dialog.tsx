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
import {
  cancelOrderFormSchema,
  type CancelOrderFormInput,
  type CancelOrderFormValues,
} from '../data/schema'
import { useCancelOrder } from '../hooks/use-orders'
import { useOrders } from './orders-provider'

export function OrderCancelDialog() {
  const { t } = useTranslation('orders')
  const { actionOpen, setActionOpen, currentRow } = useOrders()
  const cancelMutation = useCancelOrder()
  const open = actionOpen === 'cancel'

  const form = useForm<CancelOrderFormInput, unknown, CancelOrderFormValues>({
    resolver: zodResolver(cancelOrderFormSchema),
    defaultValues: { alasan: '' },
  })

  useEffect(() => {
    if (open) form.reset({ alasan: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(values: CancelOrderFormValues) {
    if (!currentRow) return
    cancelMutation.mutate(
      { id: currentRow.id, alasan: values.alasan },
      { onSuccess: () => setActionOpen(null) }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!cancelMutation.isPending) setActionOpen(state ? 'cancel' : null)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{t('cancelDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('cancelDialog.desc', { kode: currentRow?.kodeBooking ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='order-cancel-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='alasan'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cancelDialog.alasan')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('cancelDialog.alasanPlaceholder')}
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
            disabled={cancelMutation.isPending}
            onClick={() => setActionOpen(null)}
          >
            {t('cancelDialog.tutup')}
          </Button>
          <Button
            type='submit'
            form='order-cancel-form'
            variant='destructive'
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('cancelDialog.saving')}
              </>
            ) : (
              t('cancelDialog.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
