import { describe, expect, it } from 'vitest'
import type { StorefrontCustomField } from '../data/types'
import {
  buildCustomValuesPayload,
  formatCustomFieldValue,
  sortCustomFields,
} from './custom-fields'

const textField: StorefrontCustomField = {
  id: 'field-adat',
  label: 'Adat Pernikahan',
  tipe: 'text',
  opsi: null,
  wajib: true,
  urutan: 2,
}
const selectField: StorefrontCustomField = {
  id: 'field-tema',
  label: 'Tema Warna',
  tipe: 'select',
  opsi: ['Merah', 'Biru'],
  wajib: false,
  urutan: 1,
}
const checkboxField: StorefrontCustomField = {
  id: 'field-setuju',
  label: 'Setuju Syarat',
  tipe: 'checkbox',
  opsi: null,
  wajib: false,
  urutan: 3,
}
const dateField: StorefrontCustomField = {
  id: 'field-tanggal',
  label: 'Tanggal Lamaran',
  tipe: 'date',
  opsi: null,
  wajib: false,
  urutan: 4,
}
const fileField: StorefrontCustomField = {
  id: 'field-berkas',
  label: 'Berkas Referensi',
  tipe: 'file',
  opsi: null,
  wajib: false,
  urutan: 5,
}

describe('sortCustomFields', () => {
  it('sorts by urutan ascending', () => {
    const result = sortCustomFields([textField, selectField, checkboxField])
    expect(result.map((f) => f.id)).toEqual([
      selectField.id,
      textField.id,
      checkboxField.id,
    ])
  })

  it('returns an empty array for undefined input', () => {
    expect(sortCustomFields(undefined)).toEqual([])
  })

  it('does not mutate the original array', () => {
    const original = [textField, selectField]
    sortCustomFields(original)
    expect(original[0]).toBe(textField)
  })
})

describe('buildCustomValuesPayload', () => {
  it('includes filled fields only', () => {
    const result = buildCustomValuesPayload([textField, selectField], {
      [textField.id]: 'Adat Jawa',
      [selectField.id]: '',
    })
    expect(result).toEqual([
      { customFieldId: textField.id, nilai: 'Adat Jawa' },
    ])
  })

  it('always skips file fields, even when a value is somehow present', () => {
    const result = buildCustomValuesPayload([fileField], {
      [fileField.id]: 'some-value.pdf',
    })
    expect(result).toEqual([])
  })

  it('includes an unchecked checkbox ("false" is a real value, not empty)', () => {
    const result = buildCustomValuesPayload([checkboxField], {
      [checkboxField.id]: 'false',
    })
    expect(result).toEqual([
      { customFieldId: checkboxField.id, nilai: 'false' },
    ])
  })

  it('returns an empty array when values is undefined', () => {
    expect(buildCustomValuesPayload([textField], undefined)).toEqual([])
  })

  it('returns an empty array when there are no custom fields', () => {
    expect(buildCustomValuesPayload([], { anything: 'x' })).toEqual([])
  })
})

describe('formatCustomFieldValue', () => {
  const booleanLabels = { ya: 'Ya', tidak: 'Tidak' }

  it('formats checkbox "true"/"false" to human labels', () => {
    expect(formatCustomFieldValue(checkboxField, 'true', booleanLabels)).toBe(
      'Ya'
    )
    expect(formatCustomFieldValue(checkboxField, 'false', booleanLabels)).toBe(
      'Tidak'
    )
  })

  it('formats a date value without shifting the day', () => {
    const result = formatCustomFieldValue(
      dateField,
      '2026-07-20',
      booleanLabels
    )
    expect(result).toContain('20')
    expect(result).toContain('2026')
  })

  it('returns the raw value for text/select', () => {
    expect(formatCustomFieldValue(textField, 'Adat Jawa', booleanLabels)).toBe(
      'Adat Jawa'
    )
    expect(formatCustomFieldValue(selectField, 'Merah', booleanLabels)).toBe(
      'Merah'
    )
  })
})
