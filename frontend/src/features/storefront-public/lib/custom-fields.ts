import { formatDate } from '@/lib/date'
import type {
  CreateBookingCustomValueInput,
  StorefrontCustomField,
} from '../data/types'
import { parseApiDateString } from './slot-date'

/**
 * Urutkan customFields sesuai `urutan` — server sudah mengembalikan array
 * terurut, tapi aman untuk sort ulang di FE (kontrak API tidak menjamin ini
 * di masa depan).
 */
export function sortCustomFields(
  customFields: StorefrontCustomField[] | undefined
): StorefrontCustomField[] {
  return [...(customFields ?? [])].sort((a, b) => a.urutan - b.urutan)
}

/**
 * Transform nilai form (`customValues` keyed by `customFieldId`) menjadi
 * payload `customValues` utk `POST /s/:slug/bookings` — HANYA field yang
 * punya nilai. Field bertipe `file` SELALU di-skip (belum ada upload
 * sungguhan di MVP ini, lihat `storefront-booking-step-details.tsx`).
 */
export function buildCustomValuesPayload(
  customFields: StorefrontCustomField[],
  values: Record<string, string> | undefined
): CreateBookingCustomValueInput[] {
  if (!values) return []
  const result: CreateBookingCustomValueInput[] = []
  for (const field of customFields) {
    if (field.tipe === 'file') continue
    const nilai = values[field.id]
    if (nilai === undefined || nilai === '') continue
    result.push({ customFieldId: field.id, nilai })
  }
  return result
}

/**
 * Format nilai custom field jadi teks ramah manusia untuk ringkasan step 4.
 * `checkbox` diformat via label ya/tidak yang di-supply caller (i18n) supaya
 * util ini tetap murni & tidak bergantung ke i18next.
 */
export function formatCustomFieldValue(
  field: StorefrontCustomField,
  nilai: string,
  booleanLabels: { ya: string; tidak: string }
): string {
  if (field.tipe === 'checkbox') {
    return nilai === 'true' ? booleanLabels.ya : booleanLabels.tidak
  }
  if (field.tipe === 'date') {
    const parsed = parseApiDateString(nilai)
    return parsed ? formatDate(parsed, 'd MMM yyyy') : nilai
  }
  return nilai
}
