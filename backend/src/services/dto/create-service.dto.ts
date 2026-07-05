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
 * DTO untuk POST /services — buat layanan baru.
 * Validasi bisnis "dpNilai <= 100 jika dpTipe=PERSEN" dilakukan di
 * ServicesService (bukan di sini) agar konsisten dengan alur update
 * (lihat catatan desain di ServicesService.assertDpNilaiValid).
 */
export class CreateServiceDto {
  @IsString()
  @MaxLength(100, { message: 'Nama maksimal 100 karakter.' })
  nama: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsNumber()
  @IsPositive({ message: 'Harga harus lebih besar dari 0.' })
  harga: number;

  @IsInt({ message: 'Durasi harus bilangan bulat (menit).' })
  @IsPositive({ message: 'Durasi harus lebih besar dari 0.' })
  durasi: number;

  @IsOptional()
  @IsEnum(ServiceType, { message: 'Tipe layanan tidak valid.' })
  tipe?: ServiceType;

  @IsOptional()
  @IsEnum(DpTipe, { message: 'Tipe DP tidak valid.' })
  dpTipe?: DpTipe;

  @IsNumber()
  @Min(0, { message: 'Nilai DP tidak boleh negatif.' })
  dpNilai: number;

  @IsOptional()
  @IsBoolean()
  butuhTransport?: boolean;

  @IsOptional()
  @IsInt()
  urutanTampil?: number;
}
