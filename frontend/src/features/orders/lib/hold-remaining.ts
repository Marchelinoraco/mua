/**
 * @file src/features/orders/lib/hold-remaining.ts
 * Menghitung sisa waktu hold DP (`Booking.holdUntil`) untuk badge peringatan
 * di tabel order — status `AWAITING_DP` mengunci slot sementara sampai
 * `holdUntil`; MUA perlu tahu kalau hold hampir/sudah habis (booking bisa
 * di-EXPIRE otomatis oleh backend).
 *
 * PENTING: `holdUntil` adalah instant UTC SUNGGUHAN (`now + 120 menit`),
 * BUKAN "naive UTC" seperti `tanggalAcara` — jangan dilewatkan lewat
 * `toNaiveLocalDate` (lihat lib/naive-datetime.ts). `new Date(holdUntil)`
 * dibandingkan langsung dengan `now` di sini sudah benar.
 */

export type HoldRemainingStatus = 'active' | 'warning' | 'expired'

export interface HoldRemaining {
  status: HoldRemainingStatus
  /** Menit tersisa, dibulatkan ke atas; 0 bila sudah lewat `holdUntil`. */
  totalMinutes: number
  hours: number
  minutes: number
}

/**
 * @param holdUntil - ISO datetime `Booking.holdUntil`, atau `null` (booking
 *   bukan/sudah tidak lagi AWAITING_DP).
 * @param now - epoch ms "sekarang" (parameter agar testable & bisa dipakai
 *   dengan tick berkala dari komponen tabel).
 * @param warningThresholdMinutes - ambang batas "hampir habis" (default 15 menit).
 * @returns `null` bila `holdUntil` kosong; selain itu status + sisa waktu.
 */
export function getHoldRemaining(
  holdUntil: string | null,
  now: number = Date.now(),
  warningThresholdMinutes = 15
): HoldRemaining | null {
  if (!holdUntil) return null

  const target = new Date(holdUntil).getTime()
  const diffMs = target - now

  if (diffMs <= 0) {
    return { status: 'expired', totalMinutes: 0, hours: 0, minutes: 0 }
  }

  const totalMinutes = Math.ceil(diffMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const status: HoldRemainingStatus =
    totalMinutes <= warningThresholdMinutes ? 'warning' : 'active'

  return { status, totalMinutes, hours, minutes }
}
