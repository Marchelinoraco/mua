import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter.' })
  @MaxLength(72, { message: 'Password maksimal 72 karakter.' })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+]?[0-9]{8,15}$/, {
    message: 'Format nomor telepon tidak valid.',
  })
  phone?: string;

  @IsNotEmpty({ message: 'Nama bisnis wajib diisi.' })
  @IsString()
  @MaxLength(100)
  namaBisnis: string;

  @IsNotEmpty({ message: 'Slug wajib diisi.' })
  @IsString()
  @Matches(/^[a-z0-9-]{3,30}$/, {
    message:
      'Slug hanya boleh huruf kecil, angka, dan tanda hubung (3–30 karakter).',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  kota?: string;
}
