import { describe, expect, it } from 'vitest'
import type { Payment } from '@/features/dashboard/data/types'
import { resolvePaymentFormState } from './payment-form-state'

function makePayment(overrides: Partial<Payment>): Payment {
  return {
    id: 'pay_1',
    tipe: 'DP',
    jumlah: 100000,
    status: 'SUBMITTED',
    buktiFotoUrl: null,
    catatanKlien: null,
    catatanMua: null,
    confirmedAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('resolvePaymentFormState', () => {
  it('menampilkan form DP saat AWAITING_DP tanpa payment', () => {
    const state = resolvePaymentFormState('AWAITING_DP', 1000000, 300000, [])
    expect(state).toEqual({
      visible: true,
      tipe: 'DP',
      suggestedAmount: 300000,
      isReupload: false,
    })
  })

  it('menyembunyikan form DP saat sudah ada payment SUBMITTED', () => {
    const state = resolvePaymentFormState('AWAITING_DP', 1000000, 300000, [
      makePayment({ tipe: 'DP', status: 'SUBMITTED' }),
    ])
    expect(state.visible).toBe(false)
  })

  it('menyembunyikan form DP saat sudah ada payment CONFIRMED', () => {
    const state = resolvePaymentFormState('AWAITING_DP', 1000000, 300000, [
      makePayment({ tipe: 'DP', status: 'CONFIRMED' }),
    ])
    expect(state.visible).toBe(false)
  })

  it('menandai isReupload saat payment DP terakhir REJECTED', () => {
    const state = resolvePaymentFormState('AWAITING_DP', 1000000, 300000, [
      makePayment({ tipe: 'DP', status: 'REJECTED' }),
    ])
    expect(state).toEqual({
      visible: true,
      tipe: 'DP',
      suggestedAmount: 300000,
      isReupload: true,
    })
  })

  it('menampilkan form pelunasan saat CONFIRMED dengan jumlah sisa yang benar', () => {
    const state = resolvePaymentFormState('CONFIRMED', 1000000, 300000, [
      makePayment({ tipe: 'DP', status: 'CONFIRMED' }),
    ])
    expect(state).toEqual({
      visible: true,
      tipe: 'PELUNASAN',
      suggestedAmount: 700000,
      isReupload: false,
    })
  })

  it('menyembunyikan form pelunasan saat sudah ada payment PELUNASAN SUBMITTED', () => {
    const state = resolvePaymentFormState('CONFIRMED', 1000000, 300000, [
      makePayment({ tipe: 'DP', status: 'CONFIRMED' }),
      makePayment({ id: 'pay_2', tipe: 'PELUNASAN', status: 'SUBMITTED' }),
    ])
    expect(state.visible).toBe(false)
  })

  it('tidak menampilkan form untuk status PAID/COMPLETED/CANCELED/EXPIRED', () => {
    for (const status of [
      'PAID',
      'COMPLETED',
      'CANCELED',
      'EXPIRED',
    ] as const) {
      const state = resolvePaymentFormState(status, 1000000, 300000, [])
      expect(state.visible).toBe(false)
    }
  })
})
