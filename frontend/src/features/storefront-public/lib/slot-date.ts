/**
 * Util tanggal kecil khusus flow storefront-public (preview slot F05 +
 * booking F04) — REUSE di `storefront-availability.tsx` dan
 * `storefront-booking-step-schedule.tsx` supaya konversi "Date -> YYYY-MM-DD"
 * & aturan "tidak boleh pilih tanggal lampau" tidak diduplikasi.
 */

/** Konversi `Date` lokal ke string "YYYY-MM-DD" sesuai kontrak `GET /s/:slug/slots?date=`. */
export function toApiDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Tidak boleh cek/booking ketersediaan untuk tanggal yang sudah lewat. */
export function isPastDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Invers `toApiDateString` — parse string "YYYY-MM-DD" balik ke `Date`
 * lokal (dipakai utk custom field bertipe `date`, lihat
 * `lib/custom-fields.ts`). SENGAJA membangun `Date` dari komponen
 * y/m/d secara lokal (bukan `new Date(string)`) supaya tidak melewati
 * parsing UTC date-fns/native yang bisa menggeser tanggal di timezone
 * negatif — sama seperti alasan `naive-datetime.ts` ada.
 */
export function parseApiDateString(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}
