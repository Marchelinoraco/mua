import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  blockedDateFormSchema,
  type BlockedDateFormInput,
  type BlockedDateFormValues,
} from '../data/schema'
import { useCreateBlockedDate } from '../hooks/use-blocked-dates'

type BlockedDateFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyDefaults: BlockedDateFormInput = {
  tanggalMulai: undefined,
  rentang: false,
  tanggalSelesai: undefined,
  alasan: '',
}

/** Tidak boleh memblokir tanggal yang sudah lewat. */
const notPast = (date: Date) => {
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

export function BlockedDateFormDialog({
  open,
  onOpenChange,
}: BlockedDateFormDialogProps) {
  const { t } = useTranslation('schedule')
  const createMutation = useCreateBlockedDate()

  const form = useForm<BlockedDateFormInput, unknown, BlockedDateFormValues>({
    resolver: zodResolver(blockedDateFormSchema),
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (open) form.reset(emptyDefaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // eslint-disable-next-line react-hooks/incompatible-library
  const rentang = form.watch('rentang')
  const tanggalMulai = form.watch('tanggalMulai')

  function onSubmit(values: BlockedDateFormValues) {
    // `tanggalMulai` dijamin ada oleh superRefine di blockedDateFormSchema.
    const mulai = values.tanggalMulai!
    createMutation.mutate(
      {
        tanggalMulai: toApiDate(mulai),
        tanggalSelesai: toApiDate(
          values.rentang && values.tanggalSelesai
            ? values.tanggalSelesai
            : mulai
        ),
        alasan: values.alasan?.trim() ? values.alasan.trim() : undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!createMutation.isPending) onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{t('blockedDates.formDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('blockedDates.formDialog.desc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='blocked-date-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='tanggalMulai'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>
                    {rentang
                      ? t('blockedDates.formDialog.tanggalMulai')
                      : t('blockedDates.formDialog.tanggal')}
                  </FormLabel>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={notPast}
                    placeholder={t('blockedDates.formDialog.pilihTanggal')}
                    className='w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='rentang'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                  <FormLabel>{t('blockedDates.formDialog.rentang')}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {rentang && (
              <FormField
                control={form.control}
                name='tanggalSelesai'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>
                      {t('blockedDates.formDialog.tanggalSelesai')}
                    </FormLabel>
                    <DatePicker
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => notPast(date) || (!!tanggalMulai && date < tanggalMulai)}
                      placeholder={t('blockedDates.formDialog.pilihTanggal')}
                      className='w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name='alasan'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('blockedDates.formDialog.alasan')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        'blockedDates.formDialog.alasanPlaceholder'
                      )}
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
            type='submit'
            form='blocked-date-form'
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('blockedDates.formDialog.saving')}
              </>
            ) : (
              t('blockedDates.formDialog.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
