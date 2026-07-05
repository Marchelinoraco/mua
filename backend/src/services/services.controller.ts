import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ToggleServiceStatusDto } from './dto/toggle-service-status.dto';
import { ServiceResponseDto } from './dto/service-response.dto';

/**
 * ServicesController — katalog layanan MUA (F03).
 * Semua endpoint terproteksi JwtAuthGuard & tenant-scoped via @CurrentTenant().
 * FR-F03-6: TIDAK ADA endpoint DELETE — layanan hanya dinonaktifkan.
 */
@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /** GET /services?aktif=true|false — list layanan tenant. */
  @Get()
  listServices(
    @CurrentTenant() tenantId: string,
    @Query('aktif') aktifQuery?: string,
  ): Promise<ServiceResponseDto[]> {
    const aktif = this.parseAktifQuery(aktifQuery);
    return this.servicesService.listServices(tenantId, aktif);
  }

  /** POST /services — buat layanan baru. */
  @Post()
  createService(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.createService(tenantId, dto);
  }

  /** PUT /services/:id — update partial layanan. */
  @Put(':id')
  updateService(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.updateService(tenantId, id, dto);
  }

  /** PATCH /services/:id — toggle aktif/nonaktif (bukan hapus). */
  @Patch(':id')
  toggleServiceStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: ToggleServiceStatusDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.toggleServiceStatus(tenantId, id, dto);
  }

  private parseAktifQuery(value?: string): boolean | undefined {
    if (value === undefined) return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new BadRequestException(
      'Parameter aktif harus bernilai "true" atau "false".',
    );
  }
}
