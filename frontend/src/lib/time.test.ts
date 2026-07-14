import { describe, expect, it } from 'vitest'
import { hhmmKeMenit, menitKeHHmm } from './time'

describe('menitKeHHmm', () => {
  it('converts minutes to zero-padded HH:mm', () => {
    expect(menitKeHHmm(540)).toBe('09:00')
    expect(menitKeHHmm(0)).toBe('00:00')
    expect(menitKeHHmm(65)).toBe('01:05')
  })

  it('clamps to end-of-day range', () => {
    expect(menitKeHHmm(1439)).toBe('23:59')
    expect(menitKeHHmm(1440)).toBe('24:00')
    expect(menitKeHHmm(2000)).toBe('24:00')
    expect(menitKeHHmm(-10)).toBe('00:00')
  })
})

describe('hhmmKeMenit', () => {
  it('converts HH:mm to minutes since midnight', () => {
    expect(hhmmKeMenit('09:00')).toBe(540)
    expect(hhmmKeMenit('00:00')).toBe(0)
    expect(hhmmKeMenit('24:00')).toBe(1440)
  })

  it('returns null for invalid input', () => {
    expect(hhmmKeMenit('abc')).toBeNull()
    expect(hhmmKeMenit('25:00')).toBeNull()
    expect(hhmmKeMenit('10:60')).toBeNull()
    expect(hhmmKeMenit('')).toBeNull()
  })

  it('round-trips with menitKeHHmm', () => {
    expect(hhmmKeMenit(menitKeHHmm(540))).toBe(540)
    expect(menitKeHHmm(hhmmKeMenit('17:30')!)).toBe('17:30')
  })
})
