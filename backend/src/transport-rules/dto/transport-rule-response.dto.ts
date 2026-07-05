import { TransportMode } from '@prisma/client';

/**
 * Response shape untuk TransportRule.
 * id/tenantId TIDAK disertakan — tidak bocor ke response.
 */
export class TransportRuleResponseDto {
  mode: TransportMode;
  flatNominal: number | null;
  zona: { nama: string; nominal: number }[] | null;
}
