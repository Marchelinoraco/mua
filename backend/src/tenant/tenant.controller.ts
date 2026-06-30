import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';

/**
 * TenantController — semua endpoint dilindungi JwtAuthGuard.
 * tenantId diambil dari @CurrentTenant() (JWT payload, Paket A 1:1).
 */
@Controller('tenant')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /** GET /tenant/me — ambil profil tenant user yang login. */
  @Get('me')
  getMyTenant(@CurrentTenant() tenantId: string): Promise<TenantResponseDto> {
    return this.tenantService.getMyTenant(tenantId);
  }

  /** PATCH /tenant/me — perbarui nama bisnis atau kota. */
  @Patch('me')
  updateMyTenant(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.updateMyTenant(tenantId, dto);
  }
}
