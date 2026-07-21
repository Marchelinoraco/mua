import { describe, expect, it } from 'vitest'
import { getHoldRemaining } from './hold-remaining'

const NOW = new Date('2026-07-22T10:00:00.000Z').getTime()

describe('getHoldRemaining', () => {
  it('mengembalikan null bila holdUntil kosong', () => {
    expect(getHoldRemaining(null, NOW)).toBeNull()
  })

  it('status "expired" bila holdUntil sudah lewat', () => {
    const result = getHoldRemaining('2026-07-22T09:59:00.000Z', NOW)
    expect(result).toEqual({
      status: 'expired',
      totalMinutes: 0,
      hours: 0,
      minutes: 0,
    })
  })

  it('status "expired" tepat saat holdUntil == now', () => {
    const result = getHoldRemaining('2026-07-22T10:00:00.000Z', NOW)
    expect(result?.status).toBe('expired')
  })

  it('status "active" bila sisa waktu masih jauh di atas ambang peringatan', () => {
    const result = getHoldRemaining('2026-07-22T12:00:00.000Z', NOW)
    expect(result).toEqual({
      status: 'active',
      totalMinutes: 120,
      hours: 2,
      minutes: 0,
    })
  })

  it('status "warning" bila sisa waktu <= ambang (default 15 menit)', () => {
    const result = getHoldRemaining('2026-07-22T10:10:00.000Z', NOW)
    expect(result?.status).toBe('warning')
    expect(result?.totalMinutes).toBe(10)
  })

  it('menghormati ambang batas kustom', () => {
    const result = getHoldRemaining('2026-07-22T10:20:00.000Z', NOW, 30)
    expect(result?.status).toBe('warning')
  })

  it('membulatkan ke atas menit yang tersisa sebagian', () => {
    const result = getHoldRemaining('2026-07-22T10:00:30.000Z', NOW)
    expect(result?.totalMinutes).toBe(1)
  })

  it('memecah jam & menit dengan benar untuk sisa > 1 jam', () => {
    const result = getHoldRemaining('2026-07-22T11:45:00.000Z', NOW)
    expect(result).toMatchObject({ hours: 1, minutes: 45, totalMinutes: 105 })
  })
})
