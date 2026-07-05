import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransportMode } from '@prisma/client';

/** Item zona transport: { nama, nominal }. */
export class ZonaTransportItemDto {
  @IsString()
  nama: string;

  @IsNumber()
  @Min(0, { message: 'Nominal zona tidak boleh negatif.' })
  nominal: number;
}

/**
 * DTO untuk PUT /transport-rule — upsert aturan transport tenant.
 * Validasi conditional berdasar `mode` pakai @ValidateIf:
 * - mode=FLAT → flatNominal wajib.
 * - mode=ZONA → zona wajib array non-kosong.
 */
export class UpsertTransportRuleDto {
  @IsEnum(TransportMode, { message: 'Mode transport tidak valid.' })
  mode: TransportMode;

  @ValidateIf((o: UpsertTransportRuleDto) => o.mode === TransportMode.FLAT)
  @IsNumber({}, { message: 'flatNominal wajib diisi (angka) jika mode=FLAT.' })
  @Min(0, { message: 'flatNominal tidak boleh negatif.' })
  flatNominal?: number;

  @ValidateIf((o: UpsertTransportRuleDto) => o.mode === TransportMode.ZONA)
  @IsArray({ message: 'zona wajib diisi (array) jika mode=ZONA.' })
  @ArrayMinSize(1, {
    message: 'zona wajib memiliki minimal 1 item jika mode=ZONA.',
  })
  @ValidateNested({ each: true })
  @Type(() => ZonaTransportItemDto)
  zona?: ZonaTransportItemDto[];
}
