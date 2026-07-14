import { IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^[+]?[0-9]{8,15}$/, {
    message: 'Format nomor telepon tidak valid.',
  })
  phone: string;

  @IsString()
  otp: string;
}
