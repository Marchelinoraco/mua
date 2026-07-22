import { describe, expect, it } from 'vitest'
import { paymentUploadFormSchema, verifyPhoneFormSchema } from './schema'

/** Helper: bikin `File` palsu dengan `size` tertentu (jsdom `File` tidak menghitung dari isi buffer). */
function fakeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function fileListOf(...files: File[]): FileList {
  const dt = new DataTransfer()
  files.forEach((f) => dt.items.add(f))
  return dt.files
}

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

describe('paymentUploadFormSchema', () => {
  const bukti = fileListOf(fakeFile('bukti.jpg', 'image/jpeg', 1024))

  it('menerima jumlah, catatan opsional, dan file valid', () => {
    const result = paymentUploadFormSchema.safeParse({
      jumlah: 500000,
      catatanKlien: 'Sudah transfer via BCA',
      bukti,
    })
    expect(result.success).toBe(true)
  })

  it('menerima tanpa catatan (opsional)', () => {
    const result = paymentUploadFormSchema.safeParse({ jumlah: 500000, bukti })
    expect(result.success).toBe(true)
  })

  it('menolak jumlah 0 atau negatif', () => {
    expect(
      paymentUploadFormSchema.safeParse({ jumlah: 0, bukti }).success
    ).toBe(false)
    expect(
      paymentUploadFormSchema.safeParse({ jumlah: -1000, bukti }).success
    ).toBe(false)
  })

  it('menolak catatan lebih dari 500 karakter', () => {
    const result = paymentUploadFormSchema.safeParse({
      jumlah: 500000,
      catatanKlien: 'a'.repeat(501),
      bukti,
    })
    expect(result.success).toBe(false)
  })

  it('menolak tanpa file bukti', () => {
    const result = paymentUploadFormSchema.safeParse({
      jumlah: 500000,
      bukti: fileListOf(),
    })
    expect(result.success).toBe(false)
  })

  it('menolak mime type yang tidak didukung', () => {
    const result = paymentUploadFormSchema.safeParse({
      jumlah: 500000,
      bukti: fileListOf(fakeFile('bukti.txt', 'text/plain', 1024)),
    })
    expect(result.success).toBe(false)
  })

  it('menerima PDF sebagai bukti', () => {
    const result = paymentUploadFormSchema.safeParse({
      jumlah: 500000,
      bukti: fileListOf(fakeFile('bukti.pdf', 'application/pdf', 1024)),
    })
    expect(result.success).toBe(true)
  })

  it('menolak file lebih besar dari 5MB', () => {
    const result = paymentUploadFormSchema.safeParse({
      jumlah: 500000,
      bukti: fileListOf(
        fakeFile('bukti.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1)
      ),
    })
    expect(result.success).toBe(false)
  })

  it('menerima file tepat 5MB (batas atas)', () => {
    const result = paymentUploadFormSchema.safeParse({
      jumlah: 500000,
      bukti: fileListOf(fakeFile('bukti.jpg', 'image/jpeg', 5 * 1024 * 1024)),
    })
    expect(result.success).toBe(true)
  })
})
