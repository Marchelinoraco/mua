import type { StorefrontSlot } from '../data/types'

/**
 * Cek (opsional, hint UI saja) apakah slot yang dimulai di `jamMulai` cukup
 * "panjang" untuk menampung `durasiTotal` menit layanan terpilih, dengan
 * menggabungkan window-window `tersedia=true` yang berurutan dari daftar
 * slot satu hari (F05 `GET /s/:slug/slots` mengembalikan window tetap,
 * BUKAN blok sepanjang durasi booking tertentu).
 *
 * INI HANYA HINT VISUAL (mis. badge "cukup untuk durasi Anda") — validasi
 * final anti-bentrok tetap dilakukan backend (`reserveSlotOrThrow`) saat
 * submit, jadi klien tetap boleh memilih slot manapun yang `tersedia=true`.
 */
export function isSlotLongEnough(
  slots: StorefrontSlot[],
  jamMulai: number,
  durasiTotal: number
): boolean {
  if (durasiTotal <= 0) return true

  const end = jamMulai + durasiTotal
  const available = slots
    .filter((s) => s.tersedia)
    .slice()
    .sort((a, b) => a.jamMulai - b.jamMulai)

  let cursor = jamMulai
  for (const slot of available) {
    // Window mulai setelah cursor -> ada celah, tidak bisa disambung lagi
    // (daftar sudah terurut naik, jadi window berikutnya juga lebih jauh).
    if (slot.jamMulai > cursor) break
    if (slot.jamSelesai > cursor) cursor = slot.jamSelesai
    if (cursor >= end) return true
  }
  return cursor >= end
}
