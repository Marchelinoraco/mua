import { describe, expect, it } from 'vitest'
import { isSafeCssColor, resolveSafeFontFamily } from './data'

describe('resolveSafeFontFamily', () => {
  it('maps known fonts (case-insensitive) to a safe font stack', () => {
    expect(resolveSafeFontFamily('Inter')).toBe("'Inter', sans-serif")
    expect(resolveSafeFontFamily('manrope')).toBe("'Manrope', sans-serif")
    expect(resolveSafeFontFamily('MANROPE')).toBe("'Manrope', sans-serif")
  })

  it('returns undefined for unknown or empty fonts (fallback to app default)', () => {
    expect(resolveSafeFontFamily('Comic Sans MS')).toBeUndefined()
    expect(resolveSafeFontFamily(null)).toBeUndefined()
    expect(resolveSafeFontFamily(undefined)).toBeUndefined()
    expect(resolveSafeFontFamily('')).toBeUndefined()
  })
})

describe('isSafeCssColor', () => {
  it('accepts valid hex colors', () => {
    expect(isSafeCssColor('#fff')).toBe(true)
    expect(isSafeCssColor('#FF66AA')).toBe(true)
    expect(isSafeCssColor('#ff66aa80')).toBe(true)
  })

  it('accepts valid rgb/hsl colors', () => {
    expect(isSafeCssColor('rgb(255, 102, 170)')).toBe(true)
    expect(isSafeCssColor('rgba(255, 102, 170, 0.5)')).toBe(true)
    expect(isSafeCssColor('hsl(320, 100%, 70%)')).toBe(true)
  })

  it('rejects non-color / potentially unsafe values', () => {
    expect(isSafeCssColor('red; } body { display:none')).toBe(false)
    expect(isSafeCssColor('javascript:alert(1)')).toBe(false)
    expect(isSafeCssColor('')).toBe(false)
    expect(isSafeCssColor(null)).toBe(false)
    expect(isSafeCssColor(undefined)).toBe(false)
  })
})
