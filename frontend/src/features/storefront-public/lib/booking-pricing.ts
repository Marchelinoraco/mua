import type {
  StorefrontDpTipe,
  StorefrontService,
  StorefrontTransport,
} from '../data/types'

/**
 * Estimasi kalkulasi harga booking di FE — MIRROR PERSIS logika backend
 * (`backend/src/common/pricing/pricing.util.ts` + `booking.util.ts`
 * `computeBookingTotals`) supaya angka yang ditampilkan ke klien sebelum
 * submit konsisten dengan hasil akhir dari server.
 *
 * PENTING: ini HANYA estimasi tampilan. Response 201 `POST /s/:slug/bookings`
 * tetap menjadi source of truth final (BE menghitung ulang totalHarga/dpAmount
 * dari data Service tersimpan, bukan dari input klien).
 */

/**
 * Hitung nominal DP dari satu layanan.
 * - PERSEN: harga * dpNilai / 100, dibulatkan ke rupiah terdekat.
 * - NOMINAL: dpNilai langsung, di-clamp agar tidak melebihi harga.
 */
export function computeDpAmount(
  harga: number,
  dpTipe: StorefrontDpTipe,
  dpNilai: number
): number {
  if (dpTipe === 'PERSEN') {
    return Math.round((harga * dpNilai) / 100)
  }
  return Math.min(dpNilai, harga)
}

/**
 * Hitung biaya transport dari TransportRule tenant.
 * - `transport` null (belum diset) → 0.
 * - FLAT → flatNominal (0 jika null).
 * - ZONA → cari zona berdasarkan nama; 0 jika tidak ditemukan/tidak dikirim.
 */
export function computeTransportFee(
  transport: StorefrontTransport | null,
  zonaNama: string | undefined
): number {
  if (!transport) return 0
  if (transport.mode === 'FLAT') {
    return transport.flatNominal ?? 0
  }
  return transport.zona?.find((z) => z.nama === zonaNama)?.nominal ?? 0
}

export interface BookingEstimate {
  /** Layanan yang saat ini terpilih. */
  selectedServices: StorefrontService[]
  subtotal: number
  /** `true` bila salah satu layanan terpilih butuh transport. */
  requiresTransport: boolean
  transportFee: number
  total: number
  dpAmount: number
  /** Total durasi (menit) — dipakai step jadwal untuk highlight slot yang cukup panjang. */
  durasiTotal: number
}

/**
 * Ringkasan estimasi booking untuk satu set layanan terpilih (FR-F04-2).
 * `dpAmount` dijumlah PER-ITEM (pakai dpTipe/dpNilai masing-masing Service),
 * BUKAN dihitung dari total gabungan — konsisten dengan `computeBookingTotals`
 * di backend. Transport fee TIDAK ikut dikenakan DP.
 */
export function computeBookingEstimate(
  services: StorefrontService[],
  selectedServiceIds: string[],
  transport: StorefrontTransport | null,
  zonaNama: string | undefined
): BookingEstimate {
  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s.id)
  )
  const subtotal = selectedServices.reduce((sum, s) => sum + s.harga, 0)
  const durasiTotal = selectedServices.reduce((sum, s) => sum + s.durasi, 0)
  const requiresTransport = selectedServices.some((s) => s.butuhTransport)
  const transportFee = requiresTransport
    ? computeTransportFee(transport, zonaNama)
    : 0
  const dpAmount = selectedServices.reduce(
    (sum, s) => sum + computeDpAmount(s.harga, s.dpTipe, s.dpNilai),
    0
  )

  return {
    selectedServices,
    subtotal,
    requiresTransport,
    transportFee,
    total: subtotal + transportFee,
    dpAmount,
    durasiTotal,
  }
}
