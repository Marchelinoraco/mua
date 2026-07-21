import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Pola nomor WA — digit saja, opsional prefix +, panjang wajar (8-20 digit). */
const PHONE_PATTERN = /^\+?[0-9]{8,20}$/;
/** Pola tanggal-saja — divalidasi ulang & di-parse strict di booking.util. */
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class BookingClientInputDto {
  @IsString()
  @MaxLength(100, { message: 'Nama maksimal 100 karakter.' })
  nama: string;

  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'Nomor WA tidak valid (hanya digit, 8-20 karakter, boleh diawali +).',
  })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email tidak valid.' })
  email?: string;
}

export class BookingCustomValueInputDto {
  @IsString()
  customFieldId: string;

  @IsString()
  nilai: string;
}

/**
 * DTO POST /s/:slug/bookings (FR-F04-5). Endpoint publik tanpa auth — validasi
 * ketat + throttle ketat di controller (10/menit/IP, lihat booking.controller.ts).
 */
export class CreateBookingDto {
  @IsArray({ message: 'serviceIds wajib berupa array.' })
  @ArrayMinSize(1, { message: 'Pilih minimal 1 layanan.' })
  @IsString({ each: true, message: 'Setiap serviceId harus berupa string.' })
  serviceIds: string[];

  @IsString()
  @Matches(DATE_ONLY_PATTERN, { message: 'Format tanggalAcara harus YYYY-MM-DD.' })
  tanggalAcara: string;

  @IsInt({ message: 'jamMulai harus bilangan bulat (menit sejak 00:00).' })
  @Min(0)
  @Max(1439)
  jamMulai: number;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Lokasi acara maksimal 300 karakter.' })
  lokasiAcara?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  zonaNama?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Catatan maksimal 1000 karakter.' })
  catatan?: string;

  @ValidateNested()
  @Type(() => BookingClientInputDto)
  client: BookingClientInputDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingCustomValueInputDto)
  customValues?: BookingCustomValueInputDto[];
}
