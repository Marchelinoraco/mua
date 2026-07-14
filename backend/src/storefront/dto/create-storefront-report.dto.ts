import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO POST /s/:slug/report — laporan pelanggaran storefront (FR-F02-5).
 * Endpoint tulis publik tanpa auth — validasi ketat + throttle sangat ketat
 * di controller.
 */
export class CreateStorefrontReportDto {
  @IsString()
  @MinLength(10, { message: 'Alasan minimal 10 karakter.' })
  @MaxLength(1000, { message: 'Alasan maksimal 1000 karakter.' })
  alasan: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Kontak maksimal 200 karakter.' })
  kontak?: string;
}
