import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { CustomFieldResponseDto } from './dto/custom-field-response.dto';

/**
 * CustomFieldsController — pertanyaan booking kustom (F03).
 * Semua endpoint terproteksi JwtAuthGuard & tenant-scoped.
 */
@Controller('custom-fields')
@UseGuards(JwtAuthGuard)
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  /** GET /custom-fields — list, urut urutan asc. */
  @Get()
  listCustomFields(
    @CurrentTenant() tenantId: string,
  ): Promise<CustomFieldResponseDto[]> {
    return this.customFieldsService.listCustomFields(tenantId);
  }

  /** POST /custom-fields — buat custom field baru. */
  @Post()
  createCustomField(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCustomFieldDto,
  ): Promise<CustomFieldResponseDto> {
    return this.customFieldsService.createCustomField(tenantId, dto);
  }

  /** PUT /custom-fields/:id — update partial, tenant-scoped. */
  @Put(':id')
  updateCustomField(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomFieldDto,
  ): Promise<CustomFieldResponseDto> {
    return this.customFieldsService.updateCustomField(tenantId, id, dto);
  }

  /** DELETE /custom-fields/:id — hard delete; 409 jika masih dipakai booking. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCustomField(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.customFieldsService.deleteCustomField(tenantId, id);
  }
}
