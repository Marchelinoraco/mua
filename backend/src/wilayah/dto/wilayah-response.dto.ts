/**
 * Response shape data referensi wilayah (read-only, tanpa auth).
 * Dipakai FE untuk dropdown Provinsi → Kabupaten/Kota (onboarding, tenant
 * settings). Lihat WilayahService untuk sumber data (Province/Regency).
 */
export class WilayahProvinceDto {
  id: string;
  kode: string;
  nama: string;
}

export class WilayahRegencyDto {
  id: string;
  kode: string;
  nama: string;
}
