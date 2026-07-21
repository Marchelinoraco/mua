import { describe, expect, it } from 'vitest'
import type { StorefrontService, StorefrontTransport } from '../data/types'
import {
  computeBookingEstimate,
  computeDpAmount,
  computeTransportFee,
} from './booking-pricing'

function makeService(
  overrides: Partial<StorefrontService> = {}
): StorefrontService {
  return {
    id: 's1',
    nama: 'Makeup Wisuda',
    deskripsi: null,
    harga: 500_000,
    durasi: 90,
    tipe: 'MAKEUP',
    dpTipe: 'PERSEN',
    dpNilai: 30,
    butuhTransport: false,
    ...overrides,
  }
}

describe('computeDpAmount', () => {
  it('menghitung DP persen dan membulatkan ke rupiah terdekat', () => {
    expect(computeDpAmount(1_000_000, 'PERSEN', 30)).toBe(300_000)
    expect(computeDpAmount(333_333, 'PERSEN', 10)).toBe(33_333)
    expect(computeDpAmount(100_000, 'PERSEN', 33.5)).toBe(33_500)
  })

  it('menghitung DP nominal langsung', () => {
    expect(computeDpAmount(1_000_000, 'NOMINAL', 250_000)).toBe(250_000)
  })

  it('mengembalikan 0 untuk DP persen 0%', () => {
    expect(computeDpAmount(500_000, 'PERSEN', 0)).toBe(0)
  })

  it('clamp DP nominal agar tidak melebihi harga', () => {
    expect(computeDpAmount(200_000, 'NOMINAL', 500_000)).toBe(200_000)
  })
})

describe('computeTransportFee', () => {
  it('mengembalikan 0 jika transport null', () => {
    expect(computeTransportFee(null, undefined)).toBe(0)
  })

  it('mengembalikan flatNominal untuk mode FLAT', () => {
    const transport: StorefrontTransport = {
      mode: 'FLAT',
      flatNominal: 50_000,
      zona: null,
    }
    expect(computeTransportFee(transport, undefined)).toBe(50_000)
  })

  it('mengembalikan 0 untuk mode FLAT jika flatNominal null', () => {
    const transport: StorefrontTransport = {
      mode: 'FLAT',
      flatNominal: null,
      zona: null,
    }
    expect(computeTransportFee(transport, undefined)).toBe(0)
  })

  it('mencari nominal zona sesuai nama untuk mode ZONA', () => {
    const transport: StorefrontTransport = {
      mode: 'ZONA',
      flatNominal: null,
      zona: [
        { nama: 'Dalam Kota', nominal: 50_000 },
        { nama: 'Luar Kota', nominal: 150_000 },
      ],
    }
    expect(computeTransportFee(transport, 'Luar Kota')).toBe(150_000)
    expect(computeTransportFee(transport, 'Dalam Kota')).toBe(50_000)
  })

  it('mengembalikan 0 untuk mode ZONA jika zona tidak ditemukan/tidak dikirim', () => {
    const transport: StorefrontTransport = {
      mode: 'ZONA',
      flatNominal: null,
      zona: [{ nama: 'Dalam Kota', nominal: 50_000 }],
    }
    expect(computeTransportFee(transport, 'Zona Antah Berantah')).toBe(0)
    expect(computeTransportFee(transport, undefined)).toBe(0)
  })
})

describe('computeBookingEstimate', () => {
  const services: StorefrontService[] = [
    makeService({
      id: 's1',
      harga: 500_000,
      durasi: 90,
      dpTipe: 'PERSEN',
      dpNilai: 30,
    }),
    makeService({
      id: 's2',
      nama: 'Hair Do',
      harga: 300_000,
      durasi: 60,
      dpTipe: 'NOMINAL',
      dpNilai: 100_000,
      butuhTransport: true,
    }),
  ]

  it('mengembalikan estimasi kosong bila tidak ada layanan terpilih', () => {
    const estimate = computeBookingEstimate(services, [], null, undefined)
    expect(estimate.selectedServices).toHaveLength(0)
    expect(estimate.subtotal).toBe(0)
    expect(estimate.durasiTotal).toBe(0)
    expect(estimate.requiresTransport).toBe(false)
    expect(estimate.total).toBe(0)
    expect(estimate.dpAmount).toBe(0)
  })

  it('menjumlah subtotal, durasi, dan DP per-item untuk beberapa layanan', () => {
    const estimate = computeBookingEstimate(
      services,
      ['s1', 's2'],
      null,
      undefined
    )
    expect(estimate.subtotal).toBe(800_000)
    expect(estimate.durasiTotal).toBe(150)
    // DP: 30% dari 500rb (150rb) + 100rb nominal (s2) = 250rb
    expect(estimate.dpAmount).toBe(250_000)
    expect(estimate.requiresTransport).toBe(true)
  })

  it('tidak mengenakan transport fee bila tidak ada layanan yang butuhTransport', () => {
    const transport: StorefrontTransport = {
      mode: 'FLAT',
      flatNominal: 50_000,
      zona: null,
    }
    const estimate = computeBookingEstimate(
      services,
      ['s1'],
      transport,
      undefined
    )
    expect(estimate.requiresTransport).toBe(false)
    expect(estimate.transportFee).toBe(0)
    expect(estimate.total).toBe(500_000)
  })

  it('mengenakan transport fee sekali untuk seluruh booking (mode ZONA)', () => {
    const transport: StorefrontTransport = {
      mode: 'ZONA',
      flatNominal: null,
      zona: [{ nama: 'Luar Kota', nominal: 150_000 }],
    }
    const estimate = computeBookingEstimate(
      services,
      ['s1', 's2'],
      transport,
      'Luar Kota'
    )
    expect(estimate.transportFee).toBe(150_000)
    expect(estimate.total).toBe(800_000 + 150_000)
    // Transport TIDAK ikut dikenakan DP
    expect(estimate.dpAmount).toBe(250_000)
  })
})
