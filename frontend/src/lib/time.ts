/**
 * @file src/lib/time.ts
 * Konversi jam "HH:mm" <-> menit sejak 00:00 — dipakai oleh fitur Jadwal
 * (F05) untuk merepresentasikan `jamMulai`/`jamSelesai` `Availability` sesuai
 * kontrak backend (integer menit), sambil menampilkan/menerima input jam
 * dalam format yang lazim dipakai manusia ("09:00").
 */

/**
 * Mengonversi menit sejak 00:00 menjadi string "HH:mm".
 *
 * @example
 * menitKeHHmm(540)  // "09:00"
 * menitKeHHmm(1439) // "23:59"
 * menitKeHHmm(1440) // "24:00" (akhir hari, dipakai untuk jamSelesai)
 */
export function menitKeHHmm(menit: number): string {
  const clamped = Math.max(0, Math.min(1440, Math.round(menit)))
  const jam = Math.floor(clamped / 60)
  const sisaMenit = clamped % 60
  return `${String(jam).padStart(2, '0')}:${String(sisaMenit).padStart(2, '0')}`
}

/**
 * Mengonversi string "HH:mm" menjadi menit sejak 00:00.
 * Mengembalikan `null` bila format tidak valid.
 *
 * @example
 * hhmmKeMenit('09:00') // 540
 * hhmmKeMenit('24:00') // 1440
 * hhmmKeMenit('abc')   // null
 */
export function hhmmKeMenit(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!match) return null
  const jam = Number(match[1])
  const menit = Number(match[2])
  if (jam < 0 || jam > 24 || menit < 0 || menit > 59) return null
  const total = jam * 60 + menit
  if (total > 1440) return null
  return total
}
