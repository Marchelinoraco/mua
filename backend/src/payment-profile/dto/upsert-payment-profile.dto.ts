import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO untuk PUT /payment-profile — upsert rekening MUA.
 * RULE-1: hanya menyimpan instruksi rekening; tidak ada pemrosesan dana.
 */
export class UpsertPaymentProfileDto {
  @IsString()
  @MinLength(2, { message: 'Nama bank minimal 2 karakter.' })
  @MaxLength(100, { message: 'Nama bank maksimal 100 karakter.' })
  namaBank: string;

  @IsString()
  @MinLength(5, { message: 'Nomor rekening minimal 5 karakter.' })
  @MaxLength(30, { message: 'Nomor rekening maksimal 30 karakter.' })
  nomorRekening: string;

  @IsString()
  @MinLength(2, { message: 'Nama pemilik minimal 2 karakter.' })
  @MaxLength(100, { message: 'Nama pemilik maksimal 100 karakter.' })
  namaPemilik: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Instruksi tambahan maksimal 500 karakter.' })
  instruksiTambahan?: string;
}
