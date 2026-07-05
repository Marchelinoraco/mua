import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  transportRuleFormSchema,
  type TransportRuleFormInput,
  type TransportRuleFormValues,
} from '../data/schema'
import type { TransportRule } from '../data/types'
import {
  useTransportRule,
  useUpsertTransportRule,
} from '../hooks/use-transport-rule'

const emptyDefaults: TransportRuleFormInput = {
  mode: 'FLAT',
  flatNominal: 0,
  zona: [],
}

function toFormValues(
  rule: TransportRule | null | undefined
): TransportRuleFormInput {
  if (!rule) return emptyDefaults
  return {
    mode: rule.mode,
    flatNominal: rule.flatNominal ?? 0,
    zona: rule.zona ?? [],
  }
}

export function TransportSettingsCard() {
  const { t } = useTranslation('services')
  const { data, isLoading, isError } = useTransportRule()
  const upsertMutation = useUpsertTransportRule()

  const form = useForm<TransportRuleFormInput, unknown, TransportRuleFormValues>({
    resolver: zodResolver(transportRuleFormSchema),
    defaultValues: emptyDefaults,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'zona',
  })

  useEffect(() => {
    if (!isLoading) {
      form.reset(toFormValues(data))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isLoading])

  // eslint-disable-next-line react-hooks/incompatible-library
  const mode = form.watch('mode')

  function onSubmit(values: TransportRuleFormValues) {
    upsertMutation.mutate({
      mode: values.mode,
      flatNominal: values.mode === 'FLAT' ? (values.flatNominal ?? 0) : null,
      zona: values.mode === 'ZONA' ? (values.zona ?? []) : null,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('transport.title')}</CardTitle>
        <CardDescription>{t('transport.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className='py-8 text-center text-sm text-destructive'>
            {t('transport.loadError')}
          </p>
        ) : isLoading ? (
          <Skeleton className='h-32 w-full rounded-md' />
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='mode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('transport.mode')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className='grid-flow-col justify-start gap-6'
                      >
                        <div className='flex items-center gap-2'>
                          <RadioGroupItem value='FLAT' id='mode-flat' />
                          <Label htmlFor='mode-flat'>
                            {t('transport.modeFlat')}
                          </Label>
                        </div>
                        <div className='flex items-center gap-2'>
                          <RadioGroupItem value='ZONA' id='mode-zona' />
                          <Label htmlFor='mode-zona'>
                            {t('transport.modeZona')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === 'FLAT' && (
                <FormField
                  control={form.control}
                  name='flatNominal'
                  render={({ field }) => (
                    <FormItem className='max-w-xs'>
                      <FormLabel>{t('transport.flatNominal')}</FormLabel>
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
                            value={(field.value as number | string | null) ?? ''}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {mode === 'ZONA' && (
                <div className='space-y-3'>
                  {fields.length === 0 && (
                    <p className='text-sm text-muted-foreground'>
                      {t('transport.zonaEmpty')}
                    </p>
                  )}
                  {fields.map((zoneField, index) => (
                    <div
                      key={zoneField.id}
                      className='flex items-start gap-2'
                    >
                      <FormField
                        control={form.control}
                        name={`zona.${index}.nama`}
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <FormControl>
                              <Input
                                placeholder={t(
                                  'transport.zonaNamaPlaceholder'
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`zona.${index}.nominal`}
                        render={({ field }) => (
                          <FormItem className='w-40'>
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
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => remove(index)}
                      >
                        <Trash2 className='h-4 w-4' />
                        <span className='sr-only'>
                          {t('transport.zonaRemove')}
                        </span>
                      </Button>
                    </div>
                  ))}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => append({ nama: '', nominal: 0 })}
                  >
                    <Plus className='h-4 w-4' />
                    {t('transport.zonaAdd')}
                  </Button>
                </div>
              )}

              <div className='flex justify-end'>
                <Button type='submit' disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? (
                    <>
                      <Loader2 className='animate-spin' />
                      {t('transport.saving')}
                    </>
                  ) : (
                    t('transport.save')
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
