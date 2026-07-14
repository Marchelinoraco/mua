import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO POST /blocked-dates.
 * Rentang inklusif via tanggalMulai/tanggalSelesai; satu hari = keduanya sama.
 * Format tanggal: "YYYY-MM-DD" (IsDateString juga menerima ISO datetime,
 * validasi format tanggal-saja dilakukan di service via parseDateOnlyUtc).
 */
export class CreateBlockedDateDto {
  @IsDateString({}, { message: 'Format tanggalMulai harus YYYY-MM-DD.' })
  tanggalMulai: string;

  @IsDateString({}, { message: 'Format tanggalSelesai harus YYYY-MM-DD.' })
  tanggalSelesai: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Alasan maksimal 255 karakter.' })
  alasan?: string;
}
