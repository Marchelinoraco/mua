import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { BlockedDatesService } from './blocked-dates.service';
import { CreateBlockedDateDto } from './dto/create-blocked-date.dto';
import { BlockedDateResponseDto } from './dto/blocked-date-response.dto';

/**
 * BlockedDatesController — tanggal/rentang yang diblokir MUA (F05).
 * Semua endpoint terproteksi JwtAuthGuard & tenant-scoped via @CurrentTenant().
 */
@Controller('blocked-dates')
@UseGuards(JwtAuthGuard)
export class BlockedDatesController {
  constructor(private readonly blockedDatesService: BlockedDatesService) {}

  /** GET /blocked-dates?from=&to= — list (filter rentang opsional). */
  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<BlockedDateResponseDto[]> {
    return this.blockedDatesService.list(tenantId, from, to);
  }

  /** POST /blocked-dates — buat blokir tanggal/rentang. */
  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateBlockedDateDto,
  ): Promise<BlockedDateResponseDto> {
    return this.blockedDatesService.create(tenantId, dto);
  }

  /** DELETE /blocked-dates/:id — hapus (cek kepemilikan tenantId dulu). */
  @Delete(':id')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<{ id: string }> {
    return this.blockedDatesService.remove(tenantId, id);
  }
}
