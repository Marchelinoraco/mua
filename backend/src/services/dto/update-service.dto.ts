import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DpTipe, ServiceType } from '@prisma/client';

/**
 * DTO untuk PUT /services/:id — update partial layanan.
 * Semua field opsional. Validasi bisnis "dpNilai <= 100 jika dpTipe=PERSEN"
 * dilakukan di ServicesService dengan menggabungkan nilai baru + data lama
 * (dpTipe/dpNilai bisa dikirim terpisah pada request berbeda).
 */
export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Nama maksimal 100 karakter.' })
  nama?: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Harga harus lebih besar dari 0.' })
  harga?: number;

  @IsOptional()
  @IsInt({ message: 'Durasi harus bilangan bulat (menit).' })
  @IsPositive({ message: 'Durasi harus lebih besar dari 0.' })
  durasi?: number;

  @IsOptional()
  @IsEnum(ServiceType, { message: 'Tipe layanan tidak valid.' })
  tipe?: ServiceType;

  @IsOptional()
  @IsEnum(DpTipe, { message: 'Tipe DP tidak valid.' })
  dpTipe?: DpTipe;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Nilai DP tidak boleh negatif.' })
  dpNilai?: number;

  @IsOptional()
  @IsBoolean()
  butuhTransport?: boolean;

  @IsOptional()
  @IsInt()
  urutanTampil?: number;
}
