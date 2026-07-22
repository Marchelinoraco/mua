/**
 * Util pemetaan "kota tampilan" Tenant — pure function, tanpa dependensi
 * Prisma/NestJS.
 *
 * Sumber kebenaran wilayah sekarang `Tenant.regencyId` (FK opsional ke
 * Regency, rujukan terstruktur). `Tenant.kota` (teks bebas lama) DIPERTAHANKAN
 * sebagai fallback baca selama masa transisi (lihat migrasi
 * `add_wilayah_reference` & skrip `prisma/migrate-tenant-kota.ts`) — dipakai
 * hanya bila tenant belum ter-mapping ke Regency manapun.
 *
 * Dipakai oleh TenantService, AuthService, StorefrontService supaya logika
 * fallback konsisten di satu tempat, bukan diduplikasi berbeda-beda per modul.
 */

export interface TenantKotaSource {
  kota: string | null;
  regencyId: string | null;
  regency: {
    nama: string;
    provinceId: string;
    province: { nama: string };
  } | null;
}

export interface TenantKotaDisplay {
  regencyId: string | null;
  kota: string | null; // nama kab/kota tampilan
  provinceId: string | null;
  provinsi: string | null; // nama provinsi tampilan
}

/**
 * Bentuk lengkap (id + nama, kab/kota & provinsi) — dipakai endpoint yang bisa
 * diedit (tenant settings, GET/PATCH /tenants/me, GET /auth/me) supaya FE bisa
 * pre-fill dropdown cascading Provinsi → Kab/Kota tanpa round-trip tambahan.
 */
export function toTenantKotaDisplay(
  tenant: TenantKotaSource,
): TenantKotaDisplay {
  return {
    regencyId: tenant.regencyId,
    kota: tenant.regency?.nama ?? tenant.kota ?? null,
    provinceId: tenant.regency?.provinceId ?? null,
    provinsi: tenant.regency?.province.nama ?? null,
  };
}

/**
 * Hanya nama kab/kota — dipakai halaman read-only publik (storefront) yang
 * tidak butuh id untuk pre-fill dropdown apa pun, cukup teks tampilan.
 */
export function toKotaDisplayName(tenant: {
  kota: string | null;
  regency: { nama: string } | null;
}): string | null {
  return tenant.regency?.nama ?? tenant.kota ?? null;
}
