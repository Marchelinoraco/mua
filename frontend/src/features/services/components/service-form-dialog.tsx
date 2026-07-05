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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DP_TIPE_VALUES, SERVICE_TIPE_VALUES } from '../data/data'
import {
  serviceFormSchema,
  type ServiceFormInput,
  type ServiceFormValues,
} from '../data/schema'
import type { Service } from '../data/types'
import { useCreateService, useUpdateService } from '../hooks/use-services'

type ServiceFormDialogProps = {
  currentRow?: Service
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyDefaults: ServiceFormInput = {
  nama: '',
  deskripsi: '',
  harga: 0,
  durasi: 60,
  tipe: 'MAKEUP',
  dpTipe: 'PERSEN',
  dpNilai: 0,
  butuhTransport: false,
  urutanTampil: 0,
}

export function ServiceFormDialog({
  currentRow,
  open,
  onOpenChange,
}: ServiceFormDialogProps) {
  const isEdit = !!currentRow
  const { t } = useTranslation('services')

  const createMutation = useCreateService()
  const updateMutation = useUpdateService()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<ServiceFormInput, unknown, ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: isEdit
      ? {
          nama: currentRow.nama,
          deskripsi: currentRow.deskripsi ?? '',
          harga: currentRow.harga,
          durasi: currentRow.durasi,
          tipe: currentRow.tipe,
          dpTipe: currentRow.dpTipe,
          dpNilai: currentRow.dpNilai,
          butuhTransport: currentRow.butuhTransport,
          urutanTampil: currentRow.urutanTampil,
        }
      : emptyDefaults,
  })

  // Reset form values whenever the target row changes (edit -> edit lain).
  useEffect(() => {
    form.reset(
      isEdit
        ? {
            nama: currentRow.nama,
            deskripsi: currentRow.deskripsi ?? '',
            harga: currentRow.harga,
            durasi: currentRow.durasi,
            tipe: currentRow.tipe,
            dpTipe: currentRow.dpTipe,
            dpNilai: currentRow.dpNilai,
            butuhTransport: currentRow.butuhTransport,
            urutanTampil: currentRow.urutanTampil,
          }
        : emptyDefaults
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow?.id])

  // eslint-disable-next-line react-hooks/incompatible-library
  const dpTipe = form.watch('dpTipe')

  function onSubmit(values: ServiceFormValues) {
    if (isEdit) {
      updateMutation.mutate(
        { id: currentRow.id, values },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          form.reset(emptyDefaults)
          onOpenChange(false)
        },
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!isPending) {
          onOpenChange(state)
        }
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {isEdit ? t('formDialog.titleEdit') : t('formDialog.titleAdd')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('formDialog.descEdit') : t('formDialog.descAdd')}
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='service-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='nama'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('formDialog.nama')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('formDialog.namaPlaceholder')}
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='deskripsi'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('formDialog.deskripsi')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('formDialog.deskripsiPlaceholder')}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='harga'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formDialog.harga')}</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <span className='pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-muted-foreground'>
                            Rp
                          </span>
                          <Input
                            type='number'
                            min={0}
                            className='ps-9'
                            {...field}
                            value={field.value as number | string}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='durasi'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formDialog.durasi')}</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type='number'
                            min={1}
                            className='pe-14'
                            {...field}
                            value={field.value as number | string}
                          />
                          <span className='pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-muted-foreground'>
                            {t('formDialog.menit')}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='tipe'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('formDialog.tipe')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICE_TIPE_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`tipeOptions.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='dpTipe'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formDialog.dpTipe')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DP_TIPE_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {t(`dpTipeOptions.${value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='dpNilai'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('formDialog.dpNilai')}</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          {dpTipe === 'NOMINAL' && (
                            <span className='pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-muted-foreground'>
                              Rp
                            </span>
                          )}
                          <Input
                            type='number'
                            min={0}
                            max={dpTipe === 'PERSEN' ? 100 : undefined}
                            className={
                              dpTipe === 'NOMINAL' ? 'ps-9' : 'pe-9'
                            }
                            {...field}
                            value={field.value as number | string}
                          />
                          {dpTipe === 'PERSEN' && (
                            <span className='pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-muted-foreground'>
                              %
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='butuhTransport'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                    <div className='space-y-0.5'>
                      <FormLabel>{t('formDialog.butuhTransport')}</FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        {t('formDialog.butuhTransportDesc')}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='service-form' disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('formDialog.saving')}
              </>
            ) : (
              t('formDialog.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
