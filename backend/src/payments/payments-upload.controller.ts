import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService, MAX_BUKTI_FILE_SIZE_BYTES } from './payments.service';
import { CreatePaymentUploadDto } from './dto/create-payment-upload.dto';
import { PaymentUploadResponseDto } from './dto/payment-response.dto';

/**
 * PaymentsUploadController — POST /bookings/:kode/payments (F06), PUBLIK
 * tanpa auth. Path dasar sama dengan BookingStatusController (`/bookings`,
 * lihat booking-status.controller.ts) — dipisah controller/modul karena
 * domainnya pembayaran (F06), bukan status booking (F04), meski berbagi
 * prefix rute (tidak bentrok: method+segmen berbeda).
 */
@Controller('bookings')
export class PaymentsUploadController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /bookings/:kode/payments — unggah bukti transfer DP/pelunasan.
   * multipart/form-data: field teks (tipe, jumlah, phone, catatanKlien?) +
   * file `bukti`. Limit multer sedikit di atas batas bisnis (5MB, lihat
   * PaymentsService.assertValidBuktiFile) HANYA sebagai jaring pengaman
   * memori (memory storage) — pesan error yang jelas & tervalidasi datang
   * dari PaymentsService, bukan dari multer.
   * Throttle 10/menit per IP — endpoint tulis publik tanpa auth (pola sama
   * dengan POST /s/:slug/bookings, F04).
   */
  @Post(':kode/payments')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('bukti', {
      limits: { fileSize: MAX_BUKTI_FILE_SIZE_BYTES + 1024 * 1024 },
    }),
  )
  uploadBukti(
    @Param('kode') kode: string,
    @Body() dto: CreatePaymentUploadDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<PaymentUploadResponseDto> {
    return this.paymentsService.uploadBukti(kode, dto, file);
  }
}
