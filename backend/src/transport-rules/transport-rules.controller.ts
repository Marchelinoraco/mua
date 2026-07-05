import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { TransportRulesService } from './transport-rules.service';
import { UpsertTransportRuleDto } from './dto/upsert-transport-rule.dto';
import { TransportRuleResponseDto } from './dto/transport-rule-response.dto';

/**
 * TransportRulesController — aturan transport 1:1 per tenant (F03).
 * Semua endpoint terproteksi JwtAuthGuard.
 */
@Controller('transport-rule')
@UseGuards(JwtAuthGuard)
export class TransportRulesController {
  constructor(private readonly transportRulesService: TransportRulesService) {}

  /** GET /transport-rule — null jika belum pernah diset (bukan 404). */
  @Get()
  getTransportRule(
    @CurrentTenant() tenantId: string,
  ): Promise<TransportRuleResponseDto | null> {
    return this.transportRulesService.getTransportRule(tenantId);
  }

  /** PUT /transport-rule — upsert aturan transport tenant. */
  @Put()
  upsertTransportRule(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpsertTransportRuleDto,
  ): Promise<TransportRuleResponseDto> {
    return this.transportRulesService.upsertTransportRule(tenantId, dto);
  }
}
