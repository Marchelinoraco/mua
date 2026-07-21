import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { ClientsService } from './clients.service';
import { UpdateClientNotesDto } from './dto/update-client-notes.dto';
import {
  ClientDetailResponseDto,
  ClientListResponseDto,
  ClientResponseDto,
} from './dto/client-response.dto';

/**
 * ClientsController — profil & riwayat klien (F09). Semua endpoint
 * terproteksi JwtAuthGuard & tenant-scoped via @CurrentTenant().
 */
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /** GET /clients?q=&page=&limit= — daftar klien tenant, urut nama asc. */
  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ClientListResponseDto> {
    return this.clientsService.list(tenantId, q, page, limit);
  }

  /** GET /clients/:id — profil + riwayat booking. */
  @Get(':id')
  detail(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<ClientDetailResponseDto> {
    return this.clientsService.detail(tenantId, id);
  }

  /** PUT /clients/:id/notes — update catatan bebas (preferensi, alergi, dll). */
  @Put(':id/notes')
  updateNotes(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientNotesDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.updateNotes(tenantId, id, dto);
  }
}
