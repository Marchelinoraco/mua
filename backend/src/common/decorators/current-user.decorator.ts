import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;      // User.id
  email: string;
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
