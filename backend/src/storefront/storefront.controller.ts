import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { StorefrontService } from './storefront.service';
import { StorefrontProfileResponseDto } from './dto/storefront-profile-response.dto';
import { CreateStorefrontReportDto } from './dto/create-storefront-report.dto';

/**
 * StorefrontController — endpoint PUBLIK (F02), TANPA JwtAuthGuard/auth.
 * Path dasar sama dengan SlotsController (`/s/:slug`) — keduanya melayani
 * storefront publik, dipisah modul agar tetap rapi per tanggung jawab.
 */
@Controller('s/:slug')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  /** GET /s/:slug — profil storefront (branding, layanan, transport). */
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  getProfile(
    @Param('slug') slug: string,
  ): Promise<StorefrontProfileResponseDto> {
    return this.storefrontService.getProfile(slug);
  }

  /**
   * POST /s/:slug/report — laporan pelanggaran (FR-F02-5).
   * Throttle SANGAT ketat (3/menit per IP) — endpoint tulis publik tanpa auth.
   */
  @Post('report')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  createReport(
    @Param('slug') slug: string,
    @Body() dto: CreateStorefrontReportDto,
  ): Promise<{ ok: true }> {
    return this.storefrontService.createReport(slug, dto);
  }
}
