import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
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
import { CUSTOM_FIELD_TIPE_VALUES } from '../data/data'
import {
  customFieldFormSchema,
  type CustomFieldFormInput,
  type CustomFieldFormValues,
} from '../data/schema'
import type { CustomField } from '../data/types'
import {
  useCreateCustomField,
  useUpdateCustomField,
} from '../hooks/use-custom-fields'

type CustomFieldFormDialogProps = {
  currentRow?: CustomField
  open: boolean
  onOpenChange: (open: boolean) => void
}

const emptyDefaults: CustomFieldFormInput = {
  label: '',
  tipe: 'text',
  opsi: [],
  wajib: false,
  urutan: 0,
}

function toFormValues(row: CustomField): CustomFieldFormInput {
  return {
    label: row.label,
    tipe: row.tipe,
    opsi: row.opsi ?? [],
    wajib: row.wajib,
    urutan: row.urutan,
  }
}

export function CustomFieldFormDialog({
  currentRow,
  open,
  onOpenChange,
}: CustomFieldFormDialogProps) {
  const isEdit = !!currentRow
  const { t } = useTranslation('services')
  const [opsiInput, setOpsiInput] = useState('')

  const createMutation = useCreateCustomField()
  const updateMutation = useUpdateCustomField()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<CustomFieldFormInput, unknown, CustomFieldFormValues>({
    resolver: zodResolver(customFieldFormSchema),
    defaultValues: isEdit ? toFormValues(currentRow) : emptyDefaults,
  })

  useEffect(() => {
    form.reset(isEdit ? toFormValues(currentRow) : emptyDefaults)
    setOpsiInput('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow?.id])

  // eslint-disable-next-line react-hooks/incompatible-library
  const tipe = form.watch('tipe')
  const opsi = form.watch('opsi') ?? []

  function addOpsi() {
    const trimmed = opsiInput.trim()
    if (!trimmed || opsi.includes(trimmed)) {
      setOpsiInput('')
      return
    }
    form.setValue('opsi', [...opsi, trimmed], { shouldValidate: true })
    setOpsiInput('')
  }

  function removeOpsi(index: number) {
    form.setValue(
      'opsi',
      opsi.filter((_, i) => i !== index),
      { shouldValidate: true }
    )
  }

  function onSubmit(values: CustomFieldFormValues) {
    const payload: CustomFieldFormValues = {
      ...values,
      opsi: values.tipe === 'select' ? values.opsi : undefined,
    }
    if (isEdit) {
      updateMutation.mutate(
        { id: currentRow.id, values: payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(payload, {
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
            {isEdit
              ? t('customField.formDialog.titleEdit')
              : t('customField.formDialog.titleAdd')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('customField.formDialog.descEdit')
              : t('customField.formDialog.descAdd')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='custom-field-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='label'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('customField.formDialog.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'customField.formDialog.labelPlaceholder'
                      )}
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
              name='tipe'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('customField.formDialog.tipe')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CUSTOM_FIELD_TIPE_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`customFieldTipeOptions.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipe === 'select' && (
              <div className='space-y-2'>
                <FormLabel>{t('customField.formDialog.opsi')}</FormLabel>
                <div className='flex gap-2'>
                  <Input
                    value={opsiInput}
                    onChange={(e) => setOpsiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addOpsi()
                      }
                    }}
                    placeholder={t(
                      'customField.formDialog.opsiPlaceholder'
                    )}
                  />
                  <Button type='button' variant='outline' onClick={addOpsi}>
                    {t('customField.formDialog.opsiAdd')}
                  </Button>
                </div>
                {opsi.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {opsi.map((item, index) => (
                      <Badge
                        key={`${item}-${index}`}
                        variant='secondary'
                        className='gap-1 pe-1'
                      >
                        {item}
                        <button
                          type='button'
                          onClick={() => removeOpsi(index)}
                          className='rounded-full p-0.5 hover:bg-muted-foreground/20'
                        >
                          <X className='h-3 w-3' />
                          <span className='sr-only'>
                            {t('customField.formDialog.opsiRemove')}
                          </span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name='opsi'
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name='urutan'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('customField.formDialog.urutan')}</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      {...field}
                      value={field.value as number | string}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='wajib'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                  <FormLabel>{t('customField.formDialog.wajib')}</FormLabel>
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
        <DialogFooter>
          <Button
            type='submit'
            form='custom-field-form'
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('customField.formDialog.saving')}
              </>
            ) : (
              t('customField.formDialog.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
