import {
  Body,
  Controller,
  Get,
  ParseArrayPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { AvailabilityService } from './availability.service';
import { UpsertAvailabilityItemDto } from './dto/upsert-availability-item.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';

/**
 * AvailabilityController — jam kerja MUA per hari (F05).
 * Semua endpoint terproteksi JwtAuthGuard & tenant-scoped via @CurrentTenant().
 */
@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  /** GET /availability — list aturan jam kerja tenant (maks 7 hari). */
  @Get()
  listAvailability(
    @CurrentTenant() tenantId: string,
  ): Promise<AvailabilityResponseDto[]> {
    return this.availabilityService.listAvailability(tenantId);
  }

  /**
   * PUT /availability — bulk upsert array jam kerja (replace-all).
   * Body adalah ARRAY langsung (bukan dibungkus objek) — ParseArrayPipe
   * memvalidasi & mentransformasi tiap elemen ke UpsertAvailabilityItemDto.
   */
  @Put()
  upsertAvailability(
    @CurrentTenant() tenantId: string,
    @Body(new ParseArrayPipe({ items: UpsertAvailabilityItemDto }))
    items: UpsertAvailabilityItemDto[],
  ): Promise<AvailabilityResponseDto[]> {
    return this.availabilityService.upsertAll(tenantId, items);
  }
}
