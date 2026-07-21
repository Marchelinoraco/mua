import { describe, expect, it } from 'vitest'
import {
  bookingDetailsFormSchema,
  buildBookingDetailsFormSchema,
  buildCustomValuesSchema,
  buildDefaultCustomValues,
  reportFormSchema,
} from './schema'
import type { StorefrontCustomField } from './types'

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

describe('bookingDetailsFormSchema', () => {
  const valid = {
    nama: 'Sinta Dewi',
    phone: '081234567890',
    email: '',
    lokasiAcara: '',
    catatan: '',
  }

  it('accepts a minimal valid submission (email/lokasi/catatan opsional)', () => {
    const result = bookingDetailsFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts a phone number prefixed with +', () => {
    const result = bookingDetailsFormSchema.safeParse({
      ...valid,
      phone: '+6281234567890',
    })
    expect(result.success).toBe(true)
  })

  it('rejects nama shorter than 2 characters', () => {
    const result = bookingDetailsFormSchema.safeParse({ ...valid, nama: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects phone with letters', () => {
    const result = bookingDetailsFormSchema.safeParse({
      ...valid,
      phone: '0812abcd5678',
    })
    expect(result.success).toBe(false)
  })

  it('rejects phone shorter than 8 digits', () => {
    const result = bookingDetailsFormSchema.safeParse({
      ...valid,
      phone: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format when provided', () => {
    const result = bookingDetailsFormSchema.safeParse({
      ...valid,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid email', () => {
    const result = bookingDetailsFormSchema.safeParse({
      ...valid,
      email: 'klien@email.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects catatan longer than 1000 characters', () => {
    const result = bookingDetailsFormSchema.safeParse({
      ...valid,
      catatan: 'a'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects lokasiAcara longer than 300 characters', () => {
    const result = bookingDetailsFormSchema.safeParse({
      ...valid,
      lokasiAcara: 'a'.repeat(301),
    })
    expect(result.success).toBe(false)
  })
})

describe('buildCustomValuesSchema / buildBookingDetailsFormSchema', () => {
  const textWajib: StorefrontCustomField = {
    id: 'field-adat',
    label: 'Adat Pernikahan',
    tipe: 'text',
    opsi: null,
    wajib: true,
    urutan: 1,
  }
  const selectOpsional: StorefrontCustomField = {
    id: 'field-tema',
    label: 'Tema Warna',
    tipe: 'select',
    opsi: ['Merah', 'Biru'],
    wajib: false,
    urutan: 2,
  }
  const checkboxWajib: StorefrontCustomField = {
    id: 'field-setuju',
    label: 'Setuju Syarat',
    tipe: 'checkbox',
    opsi: null,
    wajib: true,
    urutan: 3,
  }
  const dateOpsional: StorefrontCustomField = {
    id: 'field-tanggal',
    label: 'Tanggal Lamaran',
    tipe: 'date',
    opsi: null,
    wajib: false,
    urutan: 4,
  }
  const fileWajib: StorefrontCustomField = {
    id: 'field-berkas',
    label: 'Berkas Referensi',
    tipe: 'file',
    opsi: null,
    wajib: true,
    urutan: 5,
  }

  it('returns an empty (always-valid) schema when there are no custom fields', () => {
    const schema = buildCustomValuesSchema([])
    expect(schema.safeParse({}).success).toBe(true)
  })

  it('rejects an empty value for a required text field', () => {
    const schema = buildCustomValuesSchema([textWajib])
    expect(schema.safeParse({ [textWajib.id]: '' }).success).toBe(false)
  })

  it('accepts a filled value for a required text field', () => {
    const schema = buildCustomValuesSchema([textWajib])
    expect(schema.safeParse({ [textWajib.id]: 'Adat Jawa' }).success).toBe(true)
  })

  it('accepts an empty value for an optional select field', () => {
    const schema = buildCustomValuesSchema([selectOpsional])
    expect(schema.safeParse({ [selectOpsional.id]: '' }).success).toBe(true)
  })

  it('rejects "false" for a required checkbox field (must be checked)', () => {
    const schema = buildCustomValuesSchema([checkboxWajib])
    expect(schema.safeParse({ [checkboxWajib.id]: 'false' }).success).toBe(
      false
    )
  })

  it('accepts "true" for a required checkbox field', () => {
    const schema = buildCustomValuesSchema([checkboxWajib])
    expect(schema.safeParse({ [checkboxWajib.id]: 'true' }).success).toBe(true)
  })

  it('never requires a file field even when wajib=true (MVP limitation)', () => {
    const schema = buildCustomValuesSchema([fileWajib])
    expect(schema.safeParse({}).success).toBe(true)
    expect(schema.safeParse({ [fileWajib.id]: '' }).success).toBe(true)
  })

  it('accepts an empty value for an optional date field', () => {
    const schema = buildCustomValuesSchema([dateOpsional])
    expect(schema.safeParse({ [dateOpsional.id]: '' }).success).toBe(true)
  })

  it('validates all fields together and reports failure when any required field is missing', () => {
    const schema = buildCustomValuesSchema([
      textWajib,
      selectOpsional,
      checkboxWajib,
    ])
    const result = schema.safeParse({
      [textWajib.id]: 'Adat Jawa',
      [selectOpsional.id]: '',
      [checkboxWajib.id]: 'false',
    })
    expect(result.success).toBe(false)
  })

  it('buildBookingDetailsFormSchema merges static + dynamic custom field validation', () => {
    const schema = buildBookingDetailsFormSchema([textWajib])
    const base = {
      nama: 'Sinta Dewi',
      phone: '081234567890',
      email: '',
      lokasiAcara: '',
      catatan: '',
    }

    expect(
      schema.safeParse({ ...base, customValues: { [textWajib.id]: '' } })
        .success
    ).toBe(false)

    expect(
      schema.safeParse({
        ...base,
        customValues: { [textWajib.id]: 'Adat Jawa' },
      }).success
    ).toBe(true)
  })

  it('buildBookingDetailsFormSchema defaults to no custom fields', () => {
    const schema = buildBookingDetailsFormSchema()
    const base = {
      nama: 'Sinta Dewi',
      phone: '081234567890',
      email: '',
      lokasiAcara: '',
      catatan: '',
    }
    expect(schema.safeParse({ ...base, customValues: {} }).success).toBe(true)
  })
})

describe('buildDefaultCustomValues', () => {
  it('defaults checkbox fields to "false" and other types to an empty string', () => {
    const fields: StorefrontCustomField[] = [
      {
        id: 'a',
        label: 'A',
        tipe: 'text',
        opsi: null,
        wajib: false,
        urutan: 1,
      },
      {
        id: 'b',
        label: 'B',
        tipe: 'checkbox',
        opsi: null,
        wajib: false,
        urutan: 2,
      },
    ]
    expect(buildDefaultCustomValues(fields)).toEqual({ a: '', b: 'false' })
  })

  it('returns an empty object for an empty field list', () => {
    expect(buildDefaultCustomValues([])).toEqual({})
  })
})
