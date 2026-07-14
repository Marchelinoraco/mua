import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import {
  reportFormSchema,
  type ReportFormInput,
  type ReportFormValues,
} from '../data/schema'
import {
  isStorefrontReportThrottleError,
  useStorefrontReport,
} from '../hooks/use-storefront-report'

type StorefrontReportDialogProps = {
  slug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyDefaults: ReportFormInput = { alasan: '', kontak: '' }

export function StorefrontReportDialog({
  slug,
  open,
  onOpenChange,
}: StorefrontReportDialogProps) {
  const { t } = useTranslation('storefront')
  const reportMutation = useStorefrontReport(slug)

  const form = useForm<ReportFormInput, unknown, ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (open) form.reset(emptyDefaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(values: ReportFormValues) {
    reportMutation.mutate(values, {
      onSuccess: () => {
        toast.success(t('report.toastSuccess'))
        onOpenChange(false)
      },
      onError: (error) => {
        if (isStorefrontReportThrottleError(error)) {
          toast.error(t('report.toastThrottle'))
          return
        }
        toast.error(t('report.toastError'))
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!reportMutation.isPending) onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{t('report.title')}</DialogTitle>
          <DialogDescription>{t('report.desc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='storefront-report-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='alasan'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('report.alasan')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('report.alasanPlaceholder')}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='kontak'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('report.kontak')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('report.kontakPlaceholder')}
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
            form='storefront-report-form'
            disabled={reportMutation.isPending}
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('report.sending')}
              </>
            ) : (
              t('report.submit')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
