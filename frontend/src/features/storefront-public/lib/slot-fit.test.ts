import { describe, expect, it } from 'vitest'
import type { StorefrontSlot } from '../data/types'
import { isSlotLongEnough } from './slot-fit'

const slots: StorefrontSlot[] = [
  { jamMulai: 540, jamSelesai: 600, tersedia: true }, // 09:00-10:00
  { jamMulai: 600, jamSelesai: 660, tersedia: true }, // 10:00-11:00
  { jamMulai: 660, jamSelesai: 720, tersedia: false }, // 11:00-12:00 (terisi)
  { jamMulai: 720, jamSelesai: 780, tersedia: true }, // 12:00-13:00
]

describe('isSlotLongEnough', () => {
  it('selalu true bila durasiTotal 0 atau negatif', () => {
    expect(isSlotLongEnough(slots, 540, 0)).toBe(true)
  })

  it('true bila satu window saja sudah cukup', () => {
    expect(isSlotLongEnough(slots, 540, 60)).toBe(true)
  })

  it('true bila beberapa window berurutan tersedia digabung cukup panjang', () => {
    expect(isSlotLongEnough(slots, 540, 120)).toBe(true) // 09:00-11:00
  })

  it('false bila melewati window yang tidak tersedia (celah)', () => {
    expect(isSlotLongEnough(slots, 540, 180)).toBe(false) // butuh sampai 12:00, tapi 11-12 terisi
  })

  it('false bila jamMulai sendiri tidak tersedia', () => {
    expect(isSlotLongEnough(slots, 660, 60)).toBe(false)
  })

  it('false bila jamMulai tidak match window manapun', () => {
    expect(isSlotLongEnough(slots, 800, 30)).toBe(false)
  })
})
