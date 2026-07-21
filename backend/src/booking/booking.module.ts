import { Module } from '@nestjs/common';
import { SlotsModule } from '../slots/slots.module';
import { BookingSubmitController } from './booking-submit.controller';
import { BookingStatusController } from './booking-status.controller';
import { BookingService } from './booking.service';

/**
 * BookingModule — F04 Booking Mandiri oleh Klien. Endpoint publik:
 * POST /s/:slug/bookings, GET /bookings/:kode, POST /bookings/:kode/verify-otp.
 * Import SlotsModule untuk menginjeksi SlotsService.reserveSlotOrThrow
 * (primitif anti-bentrok F05, WAJIB dipanggil sebelum booking.create).
 */
@Module({
  imports: [SlotsModule],
  controllers: [BookingSubmitController, BookingStatusController],
  providers: [BookingService],
})
export class BookingModule {}
