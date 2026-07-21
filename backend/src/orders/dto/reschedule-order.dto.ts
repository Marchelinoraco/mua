import { IsDateString, IsInt, Max, Min } from 'class-validator';

/**
 * DTO POST /orders/:id/reschedule.
 * Format tanggalAcara: "YYYY-MM-DD" (IsDateString juga menerima ISO datetime;
 * validasi format tanggal-saja yang ketat dilakukan di service via
 * buildTanggalAcaraUtc/parseDateOnlyUtc — pola sama dengan CreateBlockedDateDto).
 * jamMulai: menit sejak 00:00 (0-1439), sama konvensinya dengan CreateBookingDto (F04).
 */
export class RescheduleOrderDto {
  @IsDateString({}, { message: 'Format tanggalAcara harus YYYY-MM-DD.' })
  tanggalAcara: string;

  @IsInt({ message: 'jamMulai harus bilangan bulat (menit sejak 00:00).' })
  @Min(0, { message: 'jamMulai tidak boleh negatif.' })
  @Max(1439, { message: 'jamMulai maksimal 1439 (23:59).' })
  jamMulai: number;
}
