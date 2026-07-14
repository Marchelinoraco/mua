import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  DEFAULT_JAM_MULAI,
  DEFAULT_JAM_SELESAI,
  DEFAULT_KAPASITAS,
  DEFAULT_SLOT_DURASI,
  HARI_TAMPIL_ORDER,
} from '../data/data'
import {
  availabilityFormSchema,
  type AvailabilityDayFormInput,
  type AvailabilityFormInput,
  type AvailabilityFormValues,
} from '../data/schema'
import type { Availability, HariIndex } from '../data/types'
import { useAvailability, useUpdateAvailability } from '../hooks/use-availability'
import { menitKeHHmm } from '@/lib/time'

function buildDefaultDay(hari: HariIndex): AvailabilityDayFormInput {
  return {
    hari,
    aktif: false,
    jamMulai: DEFAULT_JAM_MULAI,
    jamSelesai: DEFAULT_JAM_SELESAI,
    slotDurasi: DEFAULT_SLOT_DURASI,
    kapasitas: DEFAULT_KAPASITAS,
  }
}

function toFormValues(rows: Availability[] | undefined): AvailabilityFormInput {
  const days = Array.from({ length: 7 }, (_, hari) => {
    const found = rows?.find((row) => row.hari === hari)
    if (!found) return buildDefaultDay(hari as HariIndex)
    return {
      hari: found.hari,
      aktif: true,
      jamMulai: menitKeHHmm(found.jamMulai),
      jamSelesai: menitKeHHmm(found.jamSelesai),
      slotDurasi: found.slotDurasi,
      kapasitas: found.kapasitas,
    }
  })
  return { days }
}

export function AvailabilityEditor() {
  const { t } = useTranslation('schedule')
  const { data, isLoading, isError } = useAvailability()
  const updateMutation = useUpdateAvailability()

  const form = useForm<AvailabilityFormInput, unknown, AvailabilityFormValues>(
    {
      resolver: zodResolver(availabilityFormSchema),
      defaultValues: { days: Array.from({ length: 7 }, (_, i) => buildDefaultDay(i as HariIndex)) },
    }
  )

  useEffect(() => {
    if (!isLoading) {
      form.reset(toFormValues(data))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isLoading])

  function onSubmit(values: AvailabilityFormValues) {
    updateMutation.mutate(values)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('availability.title')}</CardTitle>
        <CardDescription>{t('availability.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className='py-8 text-center text-sm text-destructive'>
            {t('availability.loadError')}
          </p>
        ) : isLoading ? (
          <div className='space-y-2'>
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className='h-16 w-full rounded-md' />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <div className='hidden gap-3 px-3 text-xs text-muted-foreground sm:grid sm:grid-cols-[8rem_1fr_1fr_6rem_6rem]'>
                <span />
                <span>{t('availability.jamMulai')}</span>
                <span>{t('availability.jamSelesai')}</span>
                <span>{t('availability.slotDurasi')}</span>
                <span>{t('availability.kapasitas')}</span>
              </div>

              <div className='space-y-3'>
                {HARI_TAMPIL_ORDER.map((hari) => {
                  // eslint-disable-next-line react-hooks/incompatible-library
                  const aktif = form.watch(`days.${hari}.aktif`)
                  return (
                    <div
                      key={hari}
                      className='grid grid-cols-1 items-start gap-3 rounded-lg border p-3 sm:grid-cols-[8rem_1fr_1fr_6rem_6rem] sm:items-center'
                    >
                      <FormField
                        control={form.control}
                        name={`days.${hari}.aktif`}
                        render={({ field }) => (
                          <FormItem className='flex flex-row items-center gap-2 space-y-0'>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-label={t(`hari.${hari}`)}
                              />
                            </FormControl>
                            <Label className='font-medium'>
                              {t(`hari.${hari}`)}
                            </Label>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`days.${hari}.jamMulai`}
                        render={({ field }) => (
                          <FormItem>
                            <Label className='mb-1 text-xs text-muted-foreground sm:hidden'>
                              {t('availability.jamMulai')}
                            </Label>
                            <FormControl>
                              <Input
                                type='time'
                                disabled={!aktif}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`days.${hari}.jamSelesai`}
                        render={({ field }) => (
                          <FormItem>
                            <Label className='mb-1 text-xs text-muted-foreground sm:hidden'>
                              {t('availability.jamSelesai')}
                            </Label>
                            <FormControl>
                              <Input
                                type='time'
                                disabled={!aktif}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`days.${hari}.slotDurasi`}
                        render={({ field }) => (
                          <FormItem>
                            <Label className='mb-1 text-xs text-muted-foreground sm:hidden'>
                              {t('availability.slotDurasi')}
                            </Label>
                            <FormControl>
                              <Input
                                type='number'
                                min={1}
                                disabled={!aktif}
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
                        name={`days.${hari}.kapasitas`}
                        render={({ field }) => (
                          <FormItem>
                            <Label className='mb-1 text-xs text-muted-foreground sm:hidden'>
                              {t('availability.kapasitas')}
                            </Label>
                            <FormControl>
                              <Input
                                type='number'
                                min={1}
                                disabled={!aktif}
                                {...field}
                                value={field.value as number}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )
                })}
              </div>

              <div className='flex justify-end'>
                <Button type='submit' disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className='animate-spin' />
                      {t('availability.saving')}
                    </>
                  ) : (
                    t('availability.save')
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
