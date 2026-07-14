import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

/** Tipe custom field yang didukung form booking (F04). */
export const CUSTOM_FIELD_TIPE = [
  'text',
  'select',
  'checkbox',
  'date',
  'file',
] as const;
export type CustomFieldTipe = (typeof CUSTOM_FIELD_TIPE)[number];

/**
 * DTO untuk POST /custom-fields — buat custom field baru.
 * opsi wajib non-kosong jika tipe=select.
 */
export class CreateCustomFieldDto {
  @IsString()
  label: string;

  @IsIn(CUSTOM_FIELD_TIPE, {
    message: `tipe harus salah satu dari: ${CUSTOM_FIELD_TIPE.join(', ')}.`,
  })
  tipe: CustomFieldTipe;

  @ValidateIf((o: CreateCustomFieldDto) => o.tipe === 'select')
  @IsArray({ message: 'opsi wajib diisi (array) jika tipe=select.' })
  @ArrayMinSize(1, {
    message: 'opsi wajib memiliki minimal 1 item jika tipe=select.',
  })
  @IsString({ each: true, message: 'Setiap opsi harus berupa string.' })
  opsi?: string[];

  @IsOptional()
  @IsBoolean()
  wajib?: boolean;

  @IsOptional()
  @IsInt()
  urutan?: number;
}
