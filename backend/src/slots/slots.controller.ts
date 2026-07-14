import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SlotsService } from './slots.service';
import { PublicSlotsResponseDto } from './dto/public-slots-response.dto';

/**
 * SlotsController — endpoint PUBLIK storefront (TANPA JwtAuthGuard, tanpa auth).
 * Rate-limit lebih ketat (30/menit) karena diakses siapa pun tanpa login (H-1).
 */
@Controller('s/:slug')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  /** GET /s/:slug/slots?date=YYYY-MM-DD — slot tersedia untuk satu tanggal. */
  @Get('slots')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  getSlots(
    @Param('slug') slug: string,
    @Query('date') date?: string,
  ): Promise<PublicSlotsResponseDto> {
    if (!date) {
      throw new BadRequestException('Parameter date wajib diisi (YYYY-MM-DD).');
    }
    return this.slotsService.getPublicSlotsBySlug(slug, date);
  }
}
