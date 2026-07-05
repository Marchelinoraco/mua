import type { CustomFieldTipe, DpTipe, ServiceTipe } from './types'

// Label ditampilkan lewat i18n (namespace `services`), file ini hanya
// menyimpan daftar nilai enum mentah agar urutan opsi konsisten di semua form.

export const SERVICE_TIPE_VALUES: ServiceTipe[] = [
  'MAKEUP',
  'HAIR',
  'NAIL',
  'OTHER',
]

export const DP_TIPE_VALUES: DpTipe[] = ['PERSEN', 'NOMINAL']

export const CUSTOM_FIELD_TIPE_VALUES: CustomFieldTipe[] = [
  'text',
  'select',
  'checkbox',
  'date',
  'file',
]

/** Kelas Tailwind badge status aktif — theme-aware (light/dark). */
export const SERVICE_AKTIF_BADGE_CLASS: Record<'true' | 'false', string> = {
  true: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  false:
    'border-transparent bg-muted text-muted-foreground',
}
