import { IsString } from 'class-validator';

/**
 * DTO POST /bookings/:kode/verify-otp — SAAT INI endpoint selalu membalas
 * 501 (lihat booking-status.controller.ts, pola sama dengan auth.controller.ts
 * H-2). DTO tetap divalidasi supaya bentuk request sudah benar begitu F08
 * (integrasi WhatsApp OTP nyata) diimplementasikan.
 */
export class VerifyBookingOtpDto {
  @IsString()
  phone: string;
}
