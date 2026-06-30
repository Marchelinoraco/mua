/**
 * Response shape untuk data Tenant.
 * Kolom internal (ownerUserId) tidak disertakan di response publik.
 */
export class TenantResponseDto {
  id: string;
  slug: string;
  namaBisnis: string;
  kota?: string | null;
  status: string;
  createdAt: Date;
}
