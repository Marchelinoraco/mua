import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  namaBisnis?: string;

  /**
   * FK ke Regency (rujukan wilayah terstruktur) — menggantikan `kota` teks
   * bebas lama. Divalidasi keberadaannya di TenantService (400 bila tidak ada).
   */
  @IsOptional()
  @IsString()
  regencyId?: string;
}
