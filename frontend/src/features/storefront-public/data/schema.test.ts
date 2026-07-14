import { describe, expect, it } from 'vitest'
import { reportFormSchema } from './schema'

describe('reportFormSchema', () => {
  it('accepts a valid report with kontak', () => {
    const result = reportFormSchema.safeParse({
      alasan: 'Konten tidak pantas dan menyesatkan calon klien.',
      kontak: '0812xxxx',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid report without kontak (optional)', () => {
    const result = reportFormSchema.safeParse({
      alasan: 'Konten tidak pantas dan menyesatkan calon klien.',
      kontak: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects alasan shorter than 10 characters', () => {
    const result = reportFormSchema.safeParse({
      alasan: 'terlalu pendek'.slice(0, 5),
    })
    expect(result.success).toBe(false)
  })

  it('rejects alasan longer than 1000 characters', () => {
    const result = reportFormSchema.safeParse({ alasan: 'a'.repeat(1001) })
    expect(result.success).toBe(false)
  })

  it('rejects kontak longer than 200 characters', () => {
    const result = reportFormSchema.safeParse({
      alasan: 'Konten tidak pantas dan menyesatkan calon klien.',
      kontak: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from alasan before validating length', () => {
    const result = reportFormSchema.safeParse({
      alasan: `   ${'a'.repeat(11)}   `,
    })
    expect(result.success).toBe(true)
  })
})
