import { Injectable } from '@nestjs/common';
import { Prisma, TransportMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertTransportRuleDto } from './dto/upsert-transport-rule.dto';
import { TransportRuleResponseDto } from './dto/transport-rule-response.dto';

const TRANSPORT_RULE_SELECT = {
  mode: true,
  flatNominal: true,
  zona: true,
} satisfies Prisma.TransportRuleSelect;

type TransportRuleRow = Prisma.TransportRuleGetPayload<{
  select: typeof TRANSPORT_RULE_SELECT;
}>;

/**
 * TransportRulesService — aturan transport 1:1 per tenant (F03).
 * Semua query WAJIB difilter tenantId.
 */
@Injectable()
export class TransportRulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /transport-rule — null jika tenant belum pernah mengatur (bukan 404). */
  async getTransportRule(
    tenantId: string,
  ): Promise<TransportRuleResponseDto | null> {
    const rule = await this.prisma.transportRule.findUnique({
      where: { tenantId },
      select: TRANSPORT_RULE_SELECT,
    });

    return rule ? this.toResponseDto(rule) : null;
  }

  /** PUT /transport-rule — upsert (create bila belum ada, update bila sudah ada). */
  async upsertTransportRule(
    tenantId: string,
    dto: UpsertTransportRuleDto,
  ): Promise<TransportRuleResponseDto> {
    const isFlat = dto.mode === TransportMode.FLAT;
    const flatNominal = isFlat ? (dto.flatNominal ?? null) : null;
    const zona = isFlat
      ? Prisma.JsonNull
      : (dto.zona as unknown as Prisma.InputJsonValue);

    const rule = await this.prisma.transportRule.upsert({
      where: { tenantId },
      create: { tenantId, mode: dto.mode, flatNominal, zona },
      update: { mode: dto.mode, flatNominal, zona },
      select: TRANSPORT_RULE_SELECT,
    });

    return this.toResponseDto(rule);
  }

  private toResponseDto(rule: TransportRuleRow): TransportRuleResponseDto {
    return {
      mode: rule.mode,
      flatNominal: rule.flatNominal === null ? null : Number(rule.flatNominal),
      zona: (rule.zona as { nama: string; nominal: number }[] | null) ?? null,
    };
  }
}
