import { describe, expect, it } from 'vitest'
import { toNaiveLocalDate } from './naive-datetime'

describe('toNaiveLocalDate', () => {
  it('mempertahankan komponen tanggal/jam UTC sebagai komponen lokal', () => {
    const result = toNaiveLocalDate('2026-07-20T11:00:00.000Z')
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(6) // Juli (0-indexed)
    expect(result.getDate()).toBe(20)
    expect(result.getHours()).toBe(11)
    expect(result.getMinutes()).toBe(0)
  })

  it('menerima input Date, bukan hanya string', () => {
    const input = new Date('2026-01-01T23:30:00.000Z')
    const result = toNaiveLocalDate(input)
    expect(result.getDate()).toBe(1)
    expect(result.getHours()).toBe(23)
    expect(result.getMinutes()).toBe(30)
  })

  it('tidak menggeser tanggal walau jam UTC dekat batas hari', () => {
    // 00:15 UTC — di timezone lokal negatif (mis. UTC-5) akan mundur ke hari
    // sebelumnya bila diformat langsung tanpa helper ini.
    const result = toNaiveLocalDate('2026-03-10T00:15:00.000Z')
    expect(result.getDate()).toBe(10)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(15)
  })

  it('mempertahankan tanggal untuk field date-only Prisma (@db.Date, jam 00:00:00 UTC persis)', () => {
    // Bentuk serialisasi persis `BlockedDate.tanggalMulai`/`tanggalSelesai`
    // (schedule/F05) — kasus paling rawan mundur satu hari di timezone
    // browser DI BELAKANG UTC bila diformat tanpa helper ini.
    const result = toNaiveLocalDate('2026-07-20T00:00:00.000Z')
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(6) // Juli (0-indexed)
    expect(result.getDate()).toBe(20)
    expect(result.getHours()).toBe(0)
  })
})
