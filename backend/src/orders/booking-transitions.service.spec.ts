import { ConflictException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { BookingTransitionsService } from './booking-transitions.service';

/**
 * Unit test BookingTransitionsService (F06) — dipakai bersama oleh
 * OrdersService.confirm (F09, lihat orders.service.spec.ts) dan
 * PaymentsService (F06, lihat payments.service.spec.ts). Fokus di sini:
 * guard WHERE-status-asal (bukan read-then-write) benar-benar terpasang,
 * dan pesan 409 sesuai transisi yang gagal.
 */
function createTxMock() {
  return {
    booking: { updateMany: jest.fn() },
    client: { update: jest.fn() },
  } as unknown as Prisma.TransactionClient & {
    booking: { updateMany: jest.Mock };
    client: { update: jest.Mock };
  };
}

const TENANT_ID = 'tenant-1';
const BOOKING_ID = 'booking-1';
const CLIENT_ID = 'client-1';

describe('BookingTransitionsService.confirmDpWithinTx', () => {
  it('sukses: updateMany WHERE statusBooking=AWAITING_DP, lalu increment Client.totalBooking', async () => {
    const tx = createTxMock();
    tx.booking.updateMany.mockResolvedValue({ count: 1 });
    const service = new BookingTransitionsService();

    await service.confirmDpWithinTx(tx, TENANT_ID, BOOKING_ID, CLIENT_ID);

    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: BOOKING_ID,
        tenantId: TENANT_ID,
        statusBooking: BookingStatus.AWAITING_DP,
      },
      data: { statusBooking: BookingStatus.CONFIRMED, holdUntil: null },
    });
    expect(tx.client.update).toHaveBeenCalledWith({
      where: { id: CLIENT_ID },
      data: { totalBooking: { increment: 1 } },
    });
  });

  it('409 bila count=0 (booking bukan AWAITING_DP — mencegah double-confirm/double-increment)', async () => {
    const tx = createTxMock();
    tx.booking.updateMany.mockResolvedValue({ count: 0 });
    const service = new BookingTransitionsService();

    await expect(
      service.confirmDpWithinTx(tx, TENANT_ID, BOOKING_ID, CLIENT_ID),
    ).rejects.toBeInstanceOf(ConflictException);
    // Client.totalBooking TIDAK boleh ter-increment bila guard gagal.
    expect(tx.client.update).not.toHaveBeenCalled();
  });
});

describe('BookingTransitionsService.confirmPelunasanWithinTx', () => {
  it('sukses: updateMany WHERE statusBooking=CONFIRMED -> PAID, tanpa sentuh Client', async () => {
    const tx = createTxMock();
    tx.booking.updateMany.mockResolvedValue({ count: 1 });
    const service = new BookingTransitionsService();

    await service.confirmPelunasanWithinTx(tx, TENANT_ID, BOOKING_ID);

    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: {
        id: BOOKING_ID,
        tenantId: TENANT_ID,
        statusBooking: BookingStatus.CONFIRMED,
      },
      data: { statusBooking: BookingStatus.PAID },
    });
    expect(tx.client.update).not.toHaveBeenCalled();
  });

  it('409 bila count=0 (booking bukan CONFIRMED)', async () => {
    const tx = createTxMock();
    tx.booking.updateMany.mockResolvedValue({ count: 0 });
    const service = new BookingTransitionsService();

    await expect(
      service.confirmPelunasanWithinTx(tx, TENANT_ID, BOOKING_ID),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
