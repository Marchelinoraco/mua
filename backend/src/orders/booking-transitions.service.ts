import { ConflictException, Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';

/**
 * BookingTransitionsService — primitif transisi status Booking yang dipicu
 * oleh konfirmasi pembayaran (F06), dipakai bersama oleh OrdersService
 * (`POST /orders/:id/confirm`, jembatan manual F09) DAN PaymentsService
 * (`POST /orders/:id/payments/:paymentId/confirm` & `.../mark-cash`, F06) —
 * SATU sumber kebenaran, jangan duplikasi logika transisi ini.
 *
 * Pola sama dengan SlotsService.reserveSlotOrThrow: setiap method menerima
 * `tx: Prisma.TransactionClient` milik PEMANGGIL (bukan membuka transaksi
 * sendiri) supaya bisa digabung atomik dengan mutasi lain (mis. update
 * Payment.status) dalam SATU `$transaction`. Guard atomik via `updateMany`
 * dengan status asal di WHERE (bukan read-then-write) — mencegah race,
 * termasuk mencegah DOUBLE INCREMENT bila dua Payment(tipe=DP) untuk booking
 * yang sama somehow keduanya dicoba dikonfirmasi (yang kedua akan menemukan
 * booking sudah bukan AWAITING_DP lagi -> count=0 -> ConflictException ->
 * seluruh transaksi pemanggil roll back, termasuk update Payment.status-nya).
 */
@Injectable()
export class BookingTransitionsService {
  /**
   * Payment(tipe=DP) CONFIRMED -> Booking AWAITING_DP -> CONFIRMED.
   * Clear holdUntil (slot terkunci permanen, AC-F06-2) + increment
   * Client.totalBooking (counter LIFETIME, sama seperti OrdersService.confirm
   * sebelum diekstrak ke sini — lihat catatan di orders.service.ts).
   */
  async confirmDpWithinTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    bookingId: string,
    clientId: string,
  ): Promise<void> {
    const result = await tx.booking.updateMany({
      where: {
        id: bookingId,
        tenantId,
        statusBooking: BookingStatus.AWAITING_DP,
      },
      data: { statusBooking: BookingStatus.CONFIRMED, holdUntil: null },
    });
    if (result.count === 0) {
      throw new ConflictException(
        'Booking harus berstatus AWAITING_DP untuk konfirmasi DP.',
      );
    }

    await tx.client.update({
      where: { id: clientId },
      data: { totalBooking: { increment: 1 } },
    });
  }

  /**
   * Payment(tipe=PELUNASAN) CONFIRMED -> Booking CONFIRMED -> PAID (BARU, F06).
   * Tidak ada perubahan Client.totalBooking — sudah di-increment saat DP.
   */
  async confirmPelunasanWithinTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    bookingId: string,
  ): Promise<void> {
    const result = await tx.booking.updateMany({
      where: {
        id: bookingId,
        tenantId,
        statusBooking: BookingStatus.CONFIRMED,
      },
      data: { statusBooking: BookingStatus.PAID },
    });
    if (result.count === 0) {
      throw new ConflictException(
        'Booking harus berstatus CONFIRMED untuk konfirmasi pelunasan.',
      );
    }
  }
}
