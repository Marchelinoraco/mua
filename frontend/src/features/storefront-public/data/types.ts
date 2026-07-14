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

/** Respons 200 saat storefront tayang normal. */
export interface StorefrontActiveResponse {
  status: 'ACTIVE'
  namaBisnis: string
  kota: string | null
  slug: string
  theme: StorefrontTheme
  services: StorefrontService[]
  transport: StorefrontTransport | null
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
