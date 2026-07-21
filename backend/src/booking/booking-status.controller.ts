import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookingService } from './booking.service';
import { BookingStatusResponseDto } from './dto/booking-response.dto';
import { VerifyBookingOtpDto } from './dto/verify-booking-otp.dto';

/**
 * BookingStatusController — status booking publik via kode (F04, FR-F04-7).
 * PUBLIK tanpa JwtAuthGuard — kecuali workaround `?phone=` (lihat catatan di
 * BookingService.getBookingStatus).
 */
@Controller('bookings')
export class BookingStatusController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * GET /bookings/:kode — status minimal by default (FR-F04-7, privasi).
   * `?phone=` opsional adalah WORKAROUND SEMENTARA verifikasi-ringan sampai
   * F08 (OTP WA nyata) siap — lihat TODO di BookingService.getBookingStatus.
   * Throttle ketat (20/menit per IP) — membatasi brute-force pencocokan nomor
   * telepon lewat parameter `phone`.
   */
  @Get(':kode')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  getBookingStatus(
    @Param('kode') kode: string,
    @Query('phone') phone?: string,
  ): Promise<BookingStatusResponseDto> {
    return this.bookingService.getBookingStatus(kode, phone);   
  }
 
  /**
   * POST /bookings/:kode/verify-otp — verifikasi OTP WhatsApp.
   *
   * H-2 (konsisten dengan auth.controller.ts): belum ada integrasi WhatsApp
   * Business API nyata (F08 belum ada). JANGAN PERNAH membuat OTP palsu yang
   * selalu sukses — itu security hole yang sudah diperbaiki minggu lalu di
   * modul auth, tidak boleh diulangi di sini. Balas 501 sampai F08 selesai.
   * TODO F08: verifikasi OTP WA nyata (integrasi WhatsApp Business API),
   * lalu HAPUS workaround `?phone=` di GET /bookings/:kode.
   */
  @Post(':kode/verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  verifyOtp(
    @Param('kode') _kode: string,
    @Body() _dto: VerifyBookingOtpDto,
  ): never {
    throw new NotImplementedException(
      'Verifikasi OTP belum tersedia — fitur WA menyusul.',
    );
  }
}
