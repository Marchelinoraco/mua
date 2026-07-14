import type { HariIndex } from './types'

// Backend memakai `hari` 0=Minggu..6=Sabtu (konvensi `Date#getDay()`), tapi
// kalender Indonesia ditampilkan Senin–Minggu — urutan tampil UI beda dengan
// urutan penyimpanan. Jangan urutkan array `Availability` dari BE langsung.
export const HARI_TAMPIL_ORDER: HariIndex[] = [1, 2, 3, 4, 5, 6, 0]

/** Label hari untuk namespace i18n `schedule` (key: `hari.<index>`). */
export const HARI_I18N_KEY: Record<HariIndex, string> = {
  0: 'hari.0',
  1: 'hari.1',
  2: 'hari.2',
  3: 'hari.3',
  4: 'hari.4',
  5: 'hari.5',
  6: 'hari.6',
}

export const DEFAULT_JAM_MULAI = '09:00'
export const DEFAULT_JAM_SELESAI = '17:00'
export const DEFAULT_SLOT_DURASI = 60
export const DEFAULT_KAPASITAS = 1
