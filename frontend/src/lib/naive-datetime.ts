/**
 * Backend menyimpan sejumlah field tanggal sebagai "tanggal/waktu naive
 * UTC" — konvensi yang dipakai konsisten di seluruh modul jadwal/slot (lihat
 * `backend/src/slots/slots.util.ts` & `backend/src/booking/booking.util.ts`
 * `buildTanggalAcaraUtc`): jam disimpan APA ADANYA di komponen jam UTC dari
 * `Date`, BUKAN sebagai instant UTC sungguhan yang perlu dikonversi ke
 * timezone lokal. Ini termasuk:
 * - `Booking.tanggalAcara` (jam mulai acara, mis. "11:00" dari slot pilihan
 *   klien) — dipakai di fitur `booking-status`.
 * - `BlockedDate.tanggalMulai` / `tanggalSelesai` — kolom Prisma `@db.Date`
 *   (tanpa komponen jam, diserialisasi sbg `...T00:00:00.000Z`) — dipakai
 *   di fitur `schedule` (`blocked-dates-list.tsx`).
 *
 * Kalau field-field ini diformat langsung lewat `date-fns` (yang selalu
 * memakai getter LOKAL browser: `getHours()`, `getDate()`, dst.), nilainya
 * akan bergeser sesuai offset timezone klien (mis. klien di WITA/+8 akan
 * melihat "11:00" tampil sebagai "19:00" — ditemukan saat uji manual E2E
 * F04, lihat changelog; utk field date-only spt `BlockedDate`, pergeseran
 * ini HANYA muncul di timezone DI BELAKANG UTC, mis. Amerika, jadi dorman
 * bagi user Indonesia tapi tetap bug nyata untuk robustness developer/masa
 * depan). `holdUntil` TIDAK memakai konvensi ini — itu instant UTC
 * sungguhan (`now + 120 menit`), jadi format lokal untuknya justru benar
 * dan TIDAK perlu (jangan) dilewatkan lewat helper ini.
 */
export function toNaiveLocalDate(value: string | Date): Date {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds()
  )
}
