/**
 * @file src/features/wilayah/data/types.ts
 * Kontrak `GET /api/wilayah/provinces` & `GET /api/wilayah/regencies` —
 * endpoint publik (tanpa auth), data referensi statis wilayah Indonesia.
 * Lihat `backend/src/wilayah/dto/wilayah-response.dto.ts`.
 */

/** Satu baris provinsi — dipakai untuk mengisi dropdown Provinsi. */
export interface Province {
  id: string
  kode: string
  nama: string
}

/** Satu baris kabupaten/kota — dipakai untuk mengisi dropdown Kota/Kabupaten. */
export interface Regency {
  id: string
  kode: string
  nama: string
}
