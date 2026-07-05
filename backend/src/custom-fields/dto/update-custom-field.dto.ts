import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { CUSTOM_FIELD_TIPE } from './create-custom-field.dto';
import type { CustomFieldTipe } from './create-custom-field.dto';

/**
 * DTO untuk PUT /custom-fields/:id — update partial.
 * Semua field opsional. Validasi "opsi wajib non-kosong jika tipe=select"
 * dilakukan di CustomFieldsService dengan menggabungkan nilai baru + data
 * lama (tipe & opsi bisa dikirim di request terpisah).
 */
export class UpdateCustomFieldDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsIn(CUSTOM_FIELD_TIPE, {
    message: `tipe harus salah satu dari: ${CUSTOM_FIELD_TIPE.join(', ')}.`,
  })
  tipe?: CustomFieldTipe;

  @IsOptional()
  @IsArray({ message: 'opsi harus berupa array.' })
  @IsString({ each: true, message: 'Setiap opsi harus berupa string.' })
  opsi?: string[];

  @IsOptional()
  @IsBoolean()
  wajib?: boolean;

  @IsOptional()
  @IsInt()
  urutan?: number;
}
