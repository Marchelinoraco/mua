import { Module } from '@nestjs/common';
import { SlotsModule } from '../slots/slots.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

/**
 * OrdersModule — F09 Manajemen Order & Data Klien (dashboard MUA).
 *
 * KEPUTUSAN ARSITEKTUR: prefix `/orders` (bukan `/bookings`) untuk seluruh
 * endpoint dashboard di modul ini. F04 sudah memakai `GET /bookings/:kode`
 * (PUBLIK, status booking oleh klien via kode+phone — lihat booking.module.ts).
 * Kalau F09 memakai pola `/bookings/:id` (auth, by cuid), kedua pola tsb
 * sama-sama "/bookings/:param" dan bertabrakan di router NestJS (segmen
 * dinamis tidak bisa dibedakan berdasarkan isi/format param). Endpoint di
 * dokumen fitur F09 bersifat indikatif (lihat docs/conventions.md) — jadi
 * dashboard SENGAJA memakai `/orders`, sementara endpoint publik F04 tetap
 * `/bookings/:kode` TANPA PERUBAHAN.
 *
 * ClientsController dibundel di modul yang sama (bukan modul terpisah)
 * karena profil & riwayat klien (FR-F09-4/5) sepenuhnya diturunkan dari data
 * Booking yang sama dan erat kaitannya secara domain — pola serupa dengan
 * BookingModule yang membundel BookingSubmitController + BookingStatusController
 * dalam satu modul.
 *
 * Import SlotsModule untuk menginjeksi SlotsService.reserveSlotOrThrow
 * (anti-bentrok F05, dipakai OrdersService.reschedule — AC-F09-2).
 */
@Module({
  imports: [SlotsModule],
  controllers: [OrdersController, ClientsController],
  providers: [OrdersService, ClientsService],
})
export class OrdersModule {}
