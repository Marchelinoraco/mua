import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Satu baris jam kerja per hari (F05, FR-F05-1).
 * `aktif` bersifat opsional dan TIDAK disimpan sebagai kolom terpisah —
 * baris dengan aktif=false diperlakukan sama seperti hari yang tidak
 * dikirim sama sekali (dihapus dari tabel Availability). Ini memungkinkan
 * FE mengirim array lengkap 7 hari sambil menonaktifkan sebagian tanpa
 * harus menghapusnya dari payload.
 */
export class UpsertAvailabilityItemDto {
  @IsInt({ message: 'hari harus bilangan bulat.' })
  @Min(0, { message: 'hari harus 0 (Minggu) sampai 6 (Sabtu).' })
  @Max(6, { message: 'hari harus 0 (Minggu) sampai 6 (Sabtu).' })
  hari: number;

  @IsInt({ message: 'jamMulai harus bilangan bulat (menit sejak 00:00).' })
  @Min(0)
  @Max(1440)
  jamMulai: number;

  @IsInt({ message: 'jamSelesai harus bilangan bulat (menit sejak 00:00).' })
  @Min(0)
  @Max(1440)
  jamSelesai: number;

  @IsInt({ message: 'slotDurasi harus bilangan bulat (menit).' })
  @Min(1, { message: 'slotDurasi harus lebih besar dari 0.' })
  slotDurasi: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'kapasitas minimal 1.' })
  kapasitas?: number;

  @IsOptional()
  @IsBoolean()
  aktif?: boolean;
}
