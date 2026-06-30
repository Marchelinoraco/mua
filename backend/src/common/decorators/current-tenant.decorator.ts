import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator @CurrentTenant()
 *
 * Resolusi tenant_id dari request yang sudah melewati JwtAuthGuard.
 * Paket A (1 user : 1 tenant): tenant_id = Tenant.id milik user yang login.
 *
 * Penggunaan di controller:
 *   @Get()
 *   @UseGuards(JwtAuthGuard)
 *   findAll(@CurrentTenant() tenantId: string) { ... }
 *
 * Setiap service domain WAJIB menerima tenantId ini dan menyertakannya
 * di setiap query Prisma sebagai filter { tenantId } — jangan pernah
 * query tanpa filter tenantId kecuali endpoint admin (di-audit).
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{
      user?: { tenantId: string };
    }>();
    return request.user?.tenantId ?? '';
  },
);
