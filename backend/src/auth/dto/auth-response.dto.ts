/**
 * Response shape untuk register & login.
 * passwordHash dan kolom internal TIDAK disertakan.
 */
export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    phone?: string | null;
  };
  tenant: {
    id: string;
    slug: string;
    namaBisnis: string;
    regencyId?: string | null;
    kota?: string | null;
    provinceId?: string | null;
    provinsi?: string | null;
    status: string;
  };
}
