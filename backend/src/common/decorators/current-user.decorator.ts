import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Payload JWT — sengaja MINIMAL (M-3): hanya `sub` + `tenantId`, cukup untuk
 * guard/tenant-scoping. `email` TIDAK disertakan di token — data profil
 * (termasuk email) diambil ulang dari DB via GET /auth/me bila FE butuh,
 * supaya perubahan email tidak "nyangkut" di token lama (expiry 7d).
 */
export interface JwtPayload {
  sub: string; // User.id
  tenantId: string; // Tenant.id — Paket A 1:1, selalu ada setelah onboarding
}

/**
 * Decorator @CurrentUser()
 * Mengambil payload JWT yang sudah diverifikasi dari request.user.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
