import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { WilayahService } from './wilayah.service';
import {
  WilayahProvinceDto,
  WilayahRegencyDto,
} from './dto/wilayah-response.dto';

/**
 * WilayahController — endpoint PUBLIK (TANPA auth), dipakai FE untuk dropdown
 * wilayah (onboarding, tenant settings). Rate-limit 60/menit (H-1) — data
 * referensi statis, aman dipanggil sesering apa pun oleh klien wajar.
 */
@Controller('wilayah')
export class WilayahController {
  constructor(private readonly wilayahService: WilayahService) {}

  /** GET /api/wilayah/provinces — seluruh provinsi, urut nama asc. */
  @Get('provinces')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  listProvinces(): Promise<WilayahProvinceDto[]> {
    return this.wilayahService.listProvinces();
  }

  /** GET /api/wilayah/regencies?provinceId= — 400 bila provinceId tidak diisi. */
  @Get('regencies')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  listRegencies(
    @Query('provinceId') provinceId?: string,
  ): Promise<WilayahRegencyDto[]> {
    if (!provinceId) {
      throw new BadRequestException('Parameter provinceId wajib diisi.');
    }
    return this.wilayahService.listRegencies(provinceId);
  }
}
