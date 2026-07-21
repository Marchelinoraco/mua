import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import {
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
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/date-picker'
import type {
  BookingDetailsFormInput,
  BookingDetailsFormValues,
} from '../data/schema'
import type { StorefrontCustomField } from '../data/types'
import { parseApiDateString, toApiDateString } from '../lib/slot-date'

type StorefrontBookingStepDetailsProps = {
  form: UseFormReturn<
    BookingDetailsFormInput,
    unknown,
    BookingDetailsFormValues
  >
  customFields: StorefrontCustomField[]
}

/**
 * Step 3 — data diri klien + custom field dinamis (F03 `CustomField`), yang
 * sekarang tersedia lewat `GET /api/s/:slug` (`customFields`, hanya utk
 * varian ACTIVE). Setiap jawaban disimpan sbg string di
 * `customValues.<customFieldId>` (lihat `data/schema.ts` — semua tipe
 * dikirim sbg string ke BE, termasuk checkbox "true"/"false" & date
 * "YYYY-MM-DD").
 *
 * Field bertipe `file` SENGAJA hanya dirender sbg `Input` teks disabled —
 * upload sungguhan belum ada endpoint-nya di MVP ini (belum ada
 * storage/upload). Nilainya TIDAK PERNAH dimasukkan ke payload submit
 * (lihat `lib/custom-fields.ts` `buildCustomValuesPayload`). KETERBATASAN
 * YANG DIKETAHUI: bila tenant membuat custom field wajib bertipe `file`,
 * submit booking via storefront publik akan selalu ditolak backend (400) —
 * di luar cakupan MVP ini, perlu fitur upload sungguhan di iterasi berikut.
 */
export function StorefrontBookingStepDetails({
  form,
  customFields,
}: StorefrontBookingStepDetailsProps) {
  const { t } = useTranslation('storefront')

  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium'>{t('booking.detailsStep.title')}</h3>

      <FormField
        control={form.control}
        name='nama'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('booking.detailsStep.nama')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('booking.detailsStep.namaPlaceholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='phone'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('booking.detailsStep.phone')}</FormLabel>
            <FormControl>
              <Input
                type='tel'
                inputMode='tel'
                placeholder={t('booking.detailsStep.phonePlaceholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='email'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('booking.detailsStep.email')}</FormLabel>
            <FormControl>
              <Input
                type='email'
                placeholder={t('booking.detailsStep.emailPlaceholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='lokasiAcara'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('booking.detailsStep.lokasiAcara')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('booking.detailsStep.lokasiAcaraPlaceholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='catatan'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('booking.detailsStep.catatan')}</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder={t('booking.detailsStep.catatanPlaceholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {customFields.map((customField) => {
        const label = customField.wajib
          ? `${customField.label} *`
          : customField.label
        const name = `customValues.${customField.id}` as const

        if (customField.tipe === 'file') {
          return (
            <FormItem key={customField.id}>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Input
                  disabled
                  readOnly
                  placeholder={t(
                    'booking.detailsStep.customFieldFilePlaceholder'
                  )}
                />
              </FormControl>
              <p className='text-xs text-muted-foreground'>
                {t('booking.detailsStep.customFieldFileNote')}
              </p>
            </FormItem>
          )
        }

        if (customField.tipe === 'checkbox') {
          return (
            <FormField
              key={customField.id}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem className='flex flex-row items-center gap-2'>
                  <FormControl>
                    <Checkbox
                      checked={field.value === 'true'}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? 'true' : 'false')
                      }
                    />
                  </FormControl>
                  <FormLabel className='font-normal'>{label}</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          )
        }

        if (customField.tipe === 'select') {
          return (
            <FormField
              key={customField.id}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue
                          placeholder={t(
                            'booking.detailsStep.customFieldSelectPlaceholder',
                            { label: customField.label }
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(customField.opsi ?? []).map((opsi) => (
                        <SelectItem key={opsi} value={opsi}>
                          {opsi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )
        }

        if (customField.tipe === 'date') {
          return (
            <FormField
              key={customField.id}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>{label}</FormLabel>
                  <DatePicker
                    selected={
                      field.value ? parseApiDateString(field.value) : undefined
                    }
                    onSelect={(date) =>
                      field.onChange(date ? toApiDateString(date) : '')
                    }
                    disabled={() => false}
                    placeholder={t(
                      'booking.detailsStep.customFieldDatePlaceholder'
                    )}
                    className='w-full justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )
        }

        // tipe === 'text'
        return (
          <FormField
            key={customField.id}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      })}
    </div>
  )
}
