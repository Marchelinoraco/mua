import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { hhmmKeMenit } from '@/lib/time'
import { DatePicker } from '@/components/date-picker'
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
import {
  rescheduleOrderFormSchema,
  type RescheduleOrderFormInput,
  type RescheduleOrderFormValues,
} from '../data/schema'
import { useRescheduleOrder } from '../hooks/use-orders'
import { useOrders } from './orders-provider'

/** Tidak boleh reschedule ke tanggal yang sudah lewat. */
function notPast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

function toApiDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const emptyDefaults: RescheduleOrderFormInput = {
  tanggal: undefined,
  jam: '',
}

export function OrderRescheduleDialog() {
  const { t } = useTranslation('orders')
  const { actionOpen, setActionOpen, currentRow } = useOrders()
  const rescheduleMutation = useRescheduleOrder()
  const open = actionOpen === 'reschedule'

  const form = useForm<
    RescheduleOrderFormInput,
    unknown,
    RescheduleOrderFormValues
  >({
    resolver: zodResolver(rescheduleOrderFormSchema),
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (open) form.reset(emptyDefaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(values: RescheduleOrderFormValues) {
    if (!currentRow) return
    const jamMulai = hhmmKeMenit(values.jam)
    if (jamMulai === null) return
    // `tanggal` dijamin ada oleh superRefine di rescheduleOrderFormSchema.
    rescheduleMutation.mutate(
      {
        id: currentRow.id,
        tanggalAcara: toApiDate(values.tanggal!),
        jamMulai,
      },
      { onSuccess: () => setActionOpen(null) }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!rescheduleMutation.isPending)
          setActionOpen(state ? 'reschedule' : null)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{t('rescheduleDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('rescheduleDialog.desc', {
              kode: currentRow?.kodeBooking ?? '',
            })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='order-reschedule-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='tanggal'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>{t('rescheduleDialog.tanggal')}</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={notPast}
                    placeholder={t('rescheduleDialog.pilihTanggal')}
                    className='w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='jam'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rescheduleDialog.jam')}</FormLabel>
                  <FormControl>
                    <Input type='time' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <p className='text-xs text-muted-foreground'>
          {t('rescheduleDialog.conflictNote')}
        </p>
        <DialogFooter>
          <Button
            variant='outline'
            type='button'
            disabled={rescheduleMutation.isPending}
            onClick={() => setActionOpen(null)}
          >
            {t('rescheduleDialog.tutup')}
          </Button>
          <Button
            type='submit'
            form='order-reschedule-form'
            disabled={rescheduleMutation.isPending}
          >
            {rescheduleMutation.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('rescheduleDialog.saving')}
              </>
            ) : (
              t('rescheduleDialog.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
