import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { SlugCheckResponseDto } from './dto/slug-check-response.dto';

/** Pola slug valid untuk validasi cepat di controller sebelum masuk service. */
const SLUG_PATTERN = /^[a-z0-9-]{3,30}$/;

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * GET /tenants/slug-check?slug=xxx — cek ketersediaan slug (endpoint publik, tanpa JWT).
   * Validasi pola: ^[a-z0-9-]{3,30}$
   * Response: { available: bool, suggestion?: string }
   */
  @Get('slug-check')
  async checkSlug(
    @Query('slug') slug: string,
  ): Promise<SlugCheckResponseDto> {
    if (!slug) {
      throw new BadRequestException('Parameter slug wajib diisi.');
    }
    if (!SLUG_PATTERN.test(slug)) {
      throw new BadRequestException(
        'Slug hanya boleh huruf kecil, angka, dan tanda hubung (3–30 karakter).',
      );
    }
    return this.tenantService.checkSlug(slug);
  }

  /** GET /tenants/me — ambil profil tenant user yang login. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyTenant(@CurrentTenant() tenantId: string): Promise<TenantResponseDto> {
    return this.tenantService.getMyTenant(tenantId);
  }

  /** PATCH /tenants/me — perbarui nama bisnis atau kota. */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMyTenant(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.updateMyTenant(tenantId, dto);
  }
}
