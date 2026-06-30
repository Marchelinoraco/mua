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
    kota?: string | null;
    status: string;
  };
}
