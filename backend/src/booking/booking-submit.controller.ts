import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingResponseDto } from './dto/booking-response.dto';

/**
 * BookingSubmitController — POST /s/:slug/bookings (F04), PUBLIK tanpa auth.
 * Path dasar sama dengan StorefrontController/SlotsController (`/s/:slug`) —
 * dipisah modul agar tetap rapi per tanggung jawab (lihat storefront.module.ts).
 */
@Controller('s/:slug')
export class BookingSubmitController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * POST /s/:slug/bookings — buat booking + hold slot 120 menit.
   * Throttle ketat (10/menit per IP) — endpoint tulis publik tanpa auth,
   * rawan spam booking (edge case §9 brief F04).
   */
  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createBooking(
    @Param('slug') slug: string,
    @Body() dto: CreateBookingDto,
  ): Promise<CreateBookingResponseDto> {
    return this.bookingService.createBooking(slug, dto);
  }
}
 