// Tipe domain F02 — Storefront Publik.
// Kontrak persis dari backend-engineer (`GET /api/s/:slug`, `/slots`, `/report`).

export type StorefrontServiceTipe = 'MAKEUP' | 'HAIR' | 'NAIL' | 'OTHER'

export type StorefrontDpTipe = 'PERSEN' | 'NOMINAL'

export type StorefrontTransportMode = 'FLAT' | 'ZONA'

export interface StorefrontTheme {
  logoUrl: string | null
  bannerUrl: string | null
  warnaPrimer: string
  warnaSekunder: string
  font: string
  template: string
  /**
   * SENGAJA tidak pernah dirender — lihat catatan keamanan di
   * `features/storefront-public/index.tsx`. Field ini hanya disimpan di tipe
   * agar kontrak API tetap lengkap/terdokumentasi.
   */
  customCss: string | null
}

export interface StorefrontService {
  id: string
  nama: string
  deskripsi: string | null
  harga: number
  durasi: number // menit
  tipe: StorefrontServiceTipe
  dpTipe: StorefrontDpTipe
  dpNilai: number
  butuhTransport: boolean
}

export interface StorefrontTransportZone {
  nama: string
  nominal: number
}

export interface StorefrontTransport {
  mode: StorefrontTransportMode
  flatNominal: number | null
  zona: StorefrontTransportZone[] | null
}

export type StorefrontCustomFieldTipe =
  | 'text'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'file'

/**
 * Custom field aktif tenant (F03) yang boleh/wajib diisi klien saat booking
 * mandiri (F04). `opsi` HANYA berisi `string[]` untuk `tipe: 'select'`,
 * selalu `null` untuk tipe lain. Backend menyimpan semua nilai jawaban
 * sebagai `String` (`CustomFieldValue.nilai`), termasuk untuk `checkbox`
 * ("true"/"false") dan `date` ("YYYY-MM-DD").
 */
export interface StorefrontCustomField {
  id: string
  label: string
  tipe: StorefrontCustomFieldTipe
  opsi: string[] | null
  wajib: boolean
  urutan: number
}

/** Respons 200 saat storefront tayang normal. */
export interface StorefrontActiveResponse {
  status: 'ACTIVE'
  namaBisnis: string
  kota: string | null
  slug: string
  theme: StorefrontTheme
  services: StorefrontService[]
  transport: StorefrontTransport | null
  /**
   * Hanya ada di varian `ACTIVE`. Varian `INACTIVE`
   * (`StorefrontRestrictedResponse`) TIDAK PERNAH menyertakan key ini sama
   * sekali — treat sebagai "tidak ada custom field", BUKAN array kosong.
   */
  customFields?: StorefrontCustomField[]
}

/** Respons 200 saat tenant RESTRICTED (langganan past-due) — hanya 2 key ini. */
export interface StorefrontRestrictedResponse {
  status: 'INACTIVE'
  namaBisnis: string
}

export type StorefrontResponse =
  | StorefrontActiveResponse
  | StorefrontRestrictedResponse

export interface StorefrontSlot {
  jamMulai: number // menit sejak 00:00
  jamSelesai: number
  tersedia: boolean
}

export interface StorefrontSlotsResponse {
  date: string
  slots: StorefrontSlot[]
}

// ── Booking mandiri (F04) ────────────────────────────────────────────────
// Kontrak persis dari backend-engineer (`POST /s/:slug/bookings`,
// `GET /bookings/:kode`) — lihat backend/src/booking/dto/*.ts.

export interface CreateBookingClientInput {
  nama: string
  phone: string
  email?: string
}

export interface CreateBookingCustomValueInput {
  customFieldId: string
  nilai: string
}

/** Body `POST /s/:slug/bookings`. */
export interface CreateBookingPayload {
  serviceIds: string[]
  tanggalAcara: string // "YYYY-MM-DD"
  jamMulai: number // menit sejak 00:00, dari slot terpilih
  lokasiAcara?: string
  zonaNama?: string
  catatan?: string
  client: CreateBookingClientInput
  customValues?: CreateBookingCustomValueInput[]
}

export interface BookingItem {
  namaSnapshot: string
  qty: number
  hargaSnapshot: number
  durasi: number
}

export interface BookingPaymentProfile {
  namaBank: string
  nomorRekening: string
  namaPemilik: string
  instruksiTambahan: string | null
}

/** Response 201 `POST /s/:slug/bookings`. */
export interface CreateBookingResponse {
  kodeBooking: string
  statusBooking: 'AWAITING_DP'
  tanggalAcara: string // ISO datetime
  holdUntil: string // ISO datetime — hold 120 menit
  totalHarga: number
  dpAmount: number
  /** `null` bila MUA belum mengisi PaymentProfile. */
  paymentProfile: BookingPaymentProfile | null
  items: BookingItem[]
}
