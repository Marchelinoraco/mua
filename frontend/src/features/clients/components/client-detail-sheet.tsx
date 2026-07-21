import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { toNaiveLocalDate } from '@/lib/naive-datetime'
import { formatCurrencyIDR } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { BOOKING_STATUS_BADGE_CLASS } from '@/features/dashboard/data/status'
import {
  clientNotesFormSchema,
  type ClientNotesFormInput,
  type ClientNotesFormValues,
} from '../data/schema'
import { useClientDetail, useUpdateClientNotes } from '../hooks/use-clients'
import { useClients } from './clients-provider'

function DetailSkeleton() {
  return (
    <div className='space-y-4 px-4'>
      <Skeleton className='h-20 w-full rounded-md' />
      <Skeleton className='h-24 w-full rounded-md' />
      <Skeleton className='h-40 w-full rounded-md' />
    </div>
  )
}

export function ClientDetailSheet() {
  const { t } = useTranslation('clients')
  const { detailOpen, setDetailOpen, currentRow, setCurrentRow } = useClients()
  const { data, isLoading, isError } = useClientDetail(currentRow?.id)
  const updateNotesMutation = useUpdateClientNotes()

  const form = useForm<ClientNotesFormInput, unknown, ClientNotesFormValues>({
    resolver: zodResolver(clientNotesFormSchema),
    defaultValues: { catatan: '' },
  })

  useEffect(() => {
    if (data) form.reset({ catatan: data.catatan ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, data?.catatan])

  function handleOpenChange(open: boolean) {
    setDetailOpen(open)
    if (!open) {
      setTimeout(() => setCurrentRow(null), 300)
    }
  }

  function onSubmit(values: ClientNotesFormValues) {
    if (!currentRow) return
    const trimmed = values.catatan.trim()
    updateNotesMutation.mutate({
      id: currentRow.id,
      catatan: trimmed === '' ? null : trimmed,
    })
  }

  if (!currentRow) return null

  // eslint-disable-next-line react-hooks/incompatible-library
  const catatanValue = form.watch('catatan')
  const isDirty = catatanValue !== (data?.catatan ?? '')

  return (
    <Sheet open={detailOpen} onOpenChange={handleOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 sm:max-w-lg'>
        <SheetHeader className='text-start'>
          <SheetTitle>{currentRow.nama}</SheetTitle>
          <SheetDescription>
            {t('detail.terdaftarSejak', {
              tanggal: formatDate(data?.createdAt ?? currentRow.createdAt, 'd MMM yyyy'),
            })}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-4 overflow-y-auto px-4 py-4'>
          {isError && (
            <p className='text-sm text-destructive'>{t('detail.loadError')}</p>
          )}

          {isLoading || !data ? (
            <DetailSkeleton />
          ) : (
            <>
              <section className='space-y-1 rounded-md border p-3 text-sm'>
                <div className='flex justify-between gap-2'>
                  <span className='text-muted-foreground'>
                    {t('detail.phone')}
                  </span>
                  <span>{data.phone}</span>
                </div>
                {data.email && (
                  <div className='flex justify-between gap-2'>
                    <span className='text-muted-foreground'>
                      {t('detail.email')}
                    </span>
                    <span>{data.email}</span>
                  </div>
                )}
                <div className='flex justify-between gap-2'>
                  <span className='text-muted-foreground'>
                    {t('detail.totalBooking')}
                  </span>
                  <span>{data.totalBooking}</span>
                </div>
              </section>

              <section className='space-y-2 rounded-md border p-3 text-sm'>
                <h3 className='font-medium'>{t('detail.catatan')}</h3>
                <Form {...form}>
                  <form
                    id='client-notes-form'
                    onSubmit={form.handleSubmit(onSubmit)}
                    className='space-y-2'
                  >
                    <FormField
                      control={form.control}
                      name='catatan'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='sr-only'>
                            {t('detail.catatan')}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('detail.catatanPlaceholder')}
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='flex justify-end'>
                      <Button
                        type='submit'
                        size='sm'
                        disabled={!isDirty || updateNotesMutation.isPending}
                      >
                        {updateNotesMutation.isPending ? (
                          <>
                            <Loader2 className='animate-spin' />
                            {t('detail.saving')}
                          </>
                        ) : (
                          t('detail.simpanCatatan')
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </section>

              <section className='space-y-2 rounded-md border p-3 text-sm'>
                <h3 className='font-medium'>{t('detail.riwayat')}</h3>
                {data.bookings.length === 0 ? (
                  <p className='text-muted-foreground'>
                    {t('detail.riwayatKosong')}
                  </p>
                ) : (
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('detail.kode')}</TableHead>
                          <TableHead>{t('detail.tanggal')}</TableHead>
                          <TableHead>{t('detail.status')}</TableHead>
                          <TableHead className='text-end'>
                            {t('detail.total')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className='font-medium whitespace-nowrap'>
                              {booking.kodeBooking}
                            </TableCell>
                            <TableCell className='whitespace-nowrap'>
                              {formatDate(
                                toNaiveLocalDate(booking.tanggalAcara),
                                'd MMM yyyy'
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  BOOKING_STATUS_BADGE_CLASS[booking.statusBooking]
                                }
                              >
                                {t(`status.${booking.statusBooking}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-end tabular-nums whitespace-nowrap'>
                              {formatCurrencyIDR(booking.totalHarga)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
