import { describe, expect, it } from 'vitest'
import {
  cancelOrderFormSchema,
  rescheduleOrderFormSchema,
} from './schema'

describe('cancelOrderFormSchema', () => {
  it('menolak alasan lebih pendek dari 5 karakter', () => {
    const result = cancelOrderFormSchema.safeParse({ alasan: 'abc' })
    expect(result.success).toBe(false)
  })

  it('menolak alasan lebih panjang dari 500 karakter', () => {
    const result = cancelOrderFormSchema.safeParse({
      alasan: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('menerima alasan valid (5-500 karakter) dan memangkas spasi', () => {
    const result = cancelOrderFormSchema.safeParse({
      alasan: '  Klien membatalkan sendiri  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.alasan).toBe('Klien membatalkan sendiri')
    }
  })

  it('menerima alasan tepat 5 karakter (batas bawah)', () => {
    const result = cancelOrderFormSchema.safeParse({ alasan: '12345' })
    expect(result.success).toBe(true)
  })
})

describe('rescheduleOrderFormSchema', () => {
  it('menolak tanpa tanggal', () => {
    const result = rescheduleOrderFormSchema.safeParse({ jam: '09:00' })
    expect(result.success).toBe(false)
  })

  it('menolak format jam tidak valid', () => {
    const result = rescheduleOrderFormSchema.safeParse({
      tanggal: new Date('2026-08-01'),
      jam: 'bukan-jam',
    })
    expect(result.success).toBe(false)
  })

  it('menerima tanggal dan jam valid', () => {
    const result = rescheduleOrderFormSchema.safeParse({
      tanggal: new Date('2026-08-01'),
      jam: '09:30',
    })
    expect(result.success).toBe(true)
  })

  it('menolak jam 24:00 (backend jamMulai maks 1439/23:59)', () => {
    const result = rescheduleOrderFormSchema.safeParse({
      tanggal: new Date('2026-08-01'),
      jam: '24:00',
    })
    expect(result.success).toBe(false)
  })

  it('menerima jam batas akhir hari yang valid 23:59', () => {
    const result = rescheduleOrderFormSchema.safeParse({
      tanggal: new Date('2026-08-01'),
      jam: '23:59',
    })
    expect(result.success).toBe(true)
  })
})
