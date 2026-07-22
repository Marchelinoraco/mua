import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsService } from './payments.service';
import { BlobStorageService } from './blob-storage.service';
import { PaymentsController } from './payments.controller';
import { PaymentsUploadController } from './payments-upload.controller';

/**
 * PaymentsModule — F06 Pembayaran Klien -> MUA (Manual, Non-Kustodi).
 *
 * Import OrdersModule untuk menginjeksi OrdersService.detail (bentuk respons
 * konsisten dengan aksi F09 lain) dan BookingTransitionsService (transisi
 * status Booking, SATU sumber logika dipakai bersama OrdersService.confirm).
 * Arah dependensi SATU ARAH — lihat catatan di orders.module.ts.
 */
@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController, PaymentsUploadController],
  providers: [PaymentsService, BlobStorageService],
})
export class PaymentsModule {}
