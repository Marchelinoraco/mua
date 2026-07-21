import { describe, expect, it } from 'vitest'
import { clientNotesFormSchema } from './schema'

describe('clientNotesFormSchema', () => {
  it('menerima catatan kosong', () => {
    const result = clientNotesFormSchema.safeParse({ catatan: '' })
    expect(result.success).toBe(true)
  })

  it('menerima field tidak dikirim (default string kosong)', () => {
    const result = clientNotesFormSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.catatan).toBe('')
  })

  it('menolak catatan lebih dari 2000 karakter', () => {
    const result = clientNotesFormSchema.safeParse({
      catatan: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('menerima catatan tepat 2000 karakter (batas atas)', () => {
    const result = clientNotesFormSchema.safeParse({
      catatan: 'a'.repeat(2000),
    })
    expect(result.success).toBe(true)
  })
})
