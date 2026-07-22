import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Pola nomor WA — sama dengan create-booking.dto.ts (F04), digit saja, opsional prefix +, 8-20 digit. */
const PHONE_PATTERN = /^\+?[0-9]{8,20}$/;

/**
 * DTO POST /bookings/:kode/payments (F06, publik) — dikirim sebagai
 * multipart/form-data (field teks di samping file `bukti`, lihat
 * PaymentsUploadController). Semua field teks tiba sebagai string mentah dari
 * multer sebelum ditransformasi ValidationPipe global (transform: true).
 */
export class CreatePaymentUploadDto {
  @IsIn(['DP', 'PELUNASAN'], { message: 'tipe harus "DP" atau "PELUNASAN".' })
  tipe: 'DP' | 'PELUNASAN';

  @Type(() => Number)
  @IsNumber({}, { message: 'jumlah harus berupa angka.' })
  @IsPositive({ message: 'jumlah harus lebih besar dari 0.' })
  jumlah: number;

  /** Verifikasi kepemilikan booking — pola sama dengan GET /bookings/:kode?phone= (F04). */
  @IsString()
  @Matches(PHONE_PATTERN, {
    message:
      'Nomor WA tidak valid (hanya digit, 8-20 karakter, boleh diawali +).',
  })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Catatan maksimal 500 karakter.' })
  catatanKlien?: string;
}
