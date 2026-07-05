/**
 * Response shape untuk GET /tenants/slug-check.
 * available = true  → slug bebas dipakai.
 * available = false → slug sudah dipakai; suggestion berisi alternatif.
 */
export class SlugCheckResponseDto {
  available: boolean;
  suggestion?: string;
}
