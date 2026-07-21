import { describe, expect, it } from 'vitest'
import { verifyPhoneFormSchema } from './schema'

describe('verifyPhoneFormSchema', () => {
  it('accepts a plain Indonesian mobile number', () => {
    const result = verifyPhoneFormSchema.safeParse({ phone: '081234567890' })
    expect(result.success).toBe(true)
  })

  it('accepts a number prefixed with +', () => {
    const result = verifyPhoneFormSchema.safeParse({
      phone: '+6281234567890',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a number with letters', () => {
    const result = verifyPhoneFormSchema.safeParse({ phone: '0812abcd5678' })
    expect(result.success).toBe(false)
  })

  it('rejects a number shorter than 8 digits', () => {
    const result = verifyPhoneFormSchema.safeParse({ phone: '1234567' })
    expect(result.success).toBe(false)
  })

  it('rejects a number longer than 20 digits', () => {
    const result = verifyPhoneFormSchema.safeParse({ phone: '1'.repeat(21) })
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = verifyPhoneFormSchema.safeParse({ phone: '' })
    expect(result.success).toBe(false)
  })
})
