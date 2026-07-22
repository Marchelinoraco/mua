/**
 * Response shape untuk data Tenant.
 * Kolom internal (ownerUserId) tidak disertakan di response publik.
 *
 * Wilayah: `regencyId`/`provinceId` untuk pre-fill dropdown cascading FE;
 * `kota`/`provinsi` = nama tampilan (join Regency/Province, fallback ke
 * `kota` teks bebas lama bila tenant belum ter-mapping — lihat
 * `common/wilayah/tenant-kota.util.ts`).
 */
export class TenantResponseDto {
  id: string;
  slug: string;
  namaBisnis: string;
  regencyId?: string | null;
  kota?: string | null;
  provinceId?: string | null;
  provinsi?: string | null;
  status: string;
  createdAt: Date;
}
