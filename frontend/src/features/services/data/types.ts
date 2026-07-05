// Tipe domain F03 — Katalog Layanan, Transport & Custom Field.
// Kontrak persis dari backend-engineer (ServiceResponseDto dkk).

export type ServiceTipe = 'MAKEUP' | 'HAIR' | 'NAIL' | 'OTHER'

export type DpTipe = 'PERSEN' | 'NOMINAL'

export interface Service {
  id: string
  nama: string
  deskripsi: string | null
  harga: number
  durasi: number // menit
  tipe: ServiceTipe
  dpTipe: DpTipe
  dpNilai: number
  butuhTransport: boolean
  aktif: boolean
  urutanTampil: number
  createdAt: string
  updatedAt: string
}

export type TransportMode = 'FLAT' | 'ZONA'

export interface TransportZone {
  nama: string
  nominal: number
}

export interface TransportRule {
  mode: TransportMode
  flatNominal: number | null
  zona: TransportZone[] | null
}

export type CustomFieldTipe = 'text' | 'select' | 'checkbox' | 'date' | 'file'

export interface CustomField {
  id: string
  label: string
  tipe: CustomFieldTipe
  opsi: string[] | null
  wajib: boolean
  urutan: number
}
