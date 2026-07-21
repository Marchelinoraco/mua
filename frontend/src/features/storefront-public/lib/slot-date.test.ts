import { describe, expect, it } from 'vitest'
import { parseApiDateString, toApiDateString } from './slot-date'

describe('parseApiDateString', () => {
  it('parses a "YYYY-MM-DD" string into a local Date with matching components', () => {
    const result = parseApiDateString('2026-07-20')
    expect(result).toBeDefined()
    expect(result?.getFullYear()).toBe(2026)
    expect(result?.getMonth()).toBe(6) // Juli (0-indexed)
    expect(result?.getDate()).toBe(20)
  })

  it('round-trips with toApiDateString', () => {
    const original = new Date(2026, 0, 5)
    const roundTripped = parseApiDateString(toApiDateString(original))
    expect(roundTripped?.getFullYear()).toBe(2026)
    expect(roundTripped?.getMonth()).toBe(0)
    expect(roundTripped?.getDate()).toBe(5)
  })

  it('returns undefined for malformed input', () => {
    expect(parseApiDateString('')).toBeUndefined()
    expect(parseApiDateString('not-a-date')).toBeUndefined()
    expect(parseApiDateString('2026-07-20T00:00:00.000Z')).toBeUndefined()
  })
})
