import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { SlotsService } from './slots.service';
import { CalendarResponseDto } from './dto/calendar-response.dto';

/**
 * CalendarController — kalender dashboard MUA (F05, FR-F05-8).
 * Terproteksi JwtAuthGuard & tenant-scoped via @CurrentTenant().
 */
@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly slotsService: SlotsService) {}

  /** GET /calendar?from=&to= — booking tenant + blocked dates + availability, grup per tanggal. */
  @Get()
  getCalendar(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<CalendarResponseDto> {
    if (!from || !to) {
      throw new BadRequestException(
        'Parameter from dan to wajib diisi (YYYY-MM-DD).',
      );
    }
    return this.slotsService.getCalendar(tenantId, from, to);
  }
}
