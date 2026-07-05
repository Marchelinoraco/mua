/**
 * Response shape untuk GET /auth/me.
 * passwordHash dan ownerUserId TIDAK disertakan.
 */
export class MeResponseDto {
  user: {
    id: string;
    email: string;
    phone: string | null;
    timezone: string | null;
  };

  tenant: {
    id: string;
    slug: string;
    namaBisnis: string;
    kota: string | null;
    status: string;
  };

  subscription: {
    status: string;
    currentPeriodEnd: Date;
    ordersUsedPeriod: number;
  } | null;
}
