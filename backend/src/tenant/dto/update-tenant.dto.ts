import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  namaBisnis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  kota?: string;
}
