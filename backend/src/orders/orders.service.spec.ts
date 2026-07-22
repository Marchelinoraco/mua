import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../slots/slots.service';
import { BookingTransitionsService } from './booking-transitions.service';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { RescheduleOrderDto } from './dto/reschedule-order.dto';

/**
 * BookingTransitionsService dipakai APA ADANYA (bukan mock) — tanpa
 * dependency Prisma di constructor-nya, method-nya hanya mengoperasikan
 * `tx` yang dioper (di sini mockTx). Ini membuat assertion terhadap
 * mockTx.booking.updateMany / mockTx.client.update di bawah tetap valid
 * persis seperti sebelum logikanya diekstrak (lihat booking-transitions.service.ts).
 * Cakupan unit test khusus BookingTransitionsService (guard race, pesan 409
 * per transisi) ada di booking-transitions.service.spec.ts.
 */
function createBookingTransitions(): BookingTransitionsService {
  return new BookingTransitionsService();
}

/**
 * Unit test OrdersService (F09) — Prisma & SlotsService di-mock, pola sama
 * dengan booking.service.spec.ts. `$transaction` di-mock supaya callback
 * (updateMany + client.update, atau reserveSlotOrThrow + updateMany) benar-
 * benar dieksekusi terhadap `mockTx`.
 */
function createPrismaMock() {
  const mockTx = {
    booking: { updateMany: jest.fn() },
    client: { update: jest.fn() },
  };
  const prisma = {
    booking: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    client: {
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb: (tx: typeof mockTx) => unknown) =>
      cb(mockTx),
    ),
  };
  return {
    prisma: prisma as unknown as PrismaService,
    mockTx,
    rawPrisma: prisma,
  };
}

function createSlotsServiceMock() {
  return {
    reserveSlotOrThrow: jest.fn().mockResolvedValue(undefined),
  } as unknown as SlotsService & { reserveSlotOrThrow: jest.Mock };
}

const TENANT_ID = 'tenant-1';
const BOOKING_ID = 'booking-1';
const CLIENT_ID = 'client-1';

const DETAIL_ROW = {
  id: BOOKING_ID,
  kodeBooking: 'GB-20260801-AAAA',
  tanggalAcara: new Date('2026-08-01T09:00:00.000Z'),
  statusBooking: BookingStatus.CONFIRMED,
  totalHarga: 1_000_000,
  dpAmount: 300_000,
  holdUntil: null,
  lokasiAcara: 'Rumah klien',
  catatan: null,
  alasanBatal: null,
  canceledAt: null,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  client: {
    id: CLIENT_ID,
    nama: 'Klien Uji',
    phone: '081234567890',
    email: null,
    catatan: null,
  },
  items: [
    {
      namaSnapshot: 'Riasan Pengantin',
      qty: 1,
      hargaSnapshot: 1_000_000,
      durasi: 120,
    },
  ],
  customValues: [],
  payments: [],
};

describe('OrdersService.list (F09, FR-F09-1)', () => {
  it('memfilter tenantId, status (multi), rentang tanggal, dan q; memetakan totalDurasiMenit/jumlahItem', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    rawPrisma.booking.count.mockResolvedValue(1);
    rawPrisma.booking.findMany.mockResolvedValue([
      {
        id: BOOKING_ID,
        kodeBooking: 'GB-20260801-AAAA',
        tanggalAcara: new Date('2026-08-01T09:00:00.000Z'),
        statusBooking: BookingStatus.CONFIRMED,
        totalHarga: 1_000_000,
        dpAmount: 300_000,
        holdUntil: null,
        client: { id: CLIENT_ID, nama: 'Klien Uji', phone: '081234567890' },
        items: [{ durasi: 60 }, { durasi: 60 }],
      },
    ]);
    const transitions = createBookingTransitions();
    const service = new OrdersService(prisma, slots, transitions);

    const result = await service.list(TENANT_ID, {
      status: 'CONFIRMED,PAID',
      from: '2026-08-01',
      to: '2026-08-31',
      q: 'sari',
      page: '2',
      limit: '10',
    });

    expect(rawPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT_ID,
          statusBooking: { in: [BookingStatus.CONFIRMED, BookingStatus.PAID] },
          OR: expect.any(Array),
        }),
        skip: 10, // (page 2 - 1) * limit 10
        take: 10,
        orderBy: { tanggalAcara: 'desc' },
      }),
    );
    expect(result).toEqual({
      data: [
        expect.objectContaining({
          id: BOOKING_ID,
          totalHarga: 1_000_000,
          dpAmount: 300_000,
          totalDurasiMenit: 120,
          jumlahItem: 2,
          client: { id: CLIENT_ID, nama: 'Klien Uji', phone: '081234567890' },
        }),
      ],
      total: 1,
      page: 2,
      limit: 10,
    });
  });

  it('default page=1 limit=20 bila tidak dikirim', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    rawPrisma.booking.count.mockResolvedValue(0);
    rawPrisma.booking.findMany.mockResolvedValue([]);
    const transitions = createBookingTransitions();
    const service = new OrdersService(prisma, slots, transitions);

    const result = await service.list(TENANT_ID, {});

    expect(rawPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('400 bila status tidak valid', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    const transitions = createBookingTransitions();
    const service = new OrdersService(prisma, slots, transitions);

    await expect(
      service.list(TENANT_ID, { status: 'BUKAN_STATUS' }),
    ).rejects.toBeInstanceOf(Error);
    expect(rawPrisma.booking.findMany).not.toHaveBeenCalled();
  });
});

describe('OrdersService.detail (F09, isolasi tenant)', () => {
  it('404 bila order tidak ditemukan / milik tenant lain', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    rawPrisma.booking.findFirst.mockResolvedValue(null);
    const transitions = createBookingTransitions();
    const service = new OrdersService(prisma, slots, transitions);

    await expect(
      service.detail(TENANT_ID, 'booking-milik-tenant-lain'),
    ).rejects.toBeInstanceOf(NotFoundException);
    // findFirst HARUS dipanggil dengan {id, tenantId} sekaligus (bukan findUnique lalu cek tenant).
    expect(rawPrisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'booking-milik-tenant-lain', tenantId: TENANT_ID },
      }),
    );
  });

  it('mengembalikan detail lengkap termasuk customValues (join label) saat ditemukan', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    rawPrisma.booking.findFirst.mockResolvedValue({
      ...DETAIL_ROW,
      customValues: [
        {
          customFieldId: 'cf-1',
          nilai: 'Adat Jawa',
          customField: { label: 'Adat Pernikahan' },
        },
      ],
    });
    const transitions = createBookingTransitions();
    const service = new OrdersService(prisma, slots, transitions);

    const result = await service.detail(TENANT_ID, BOOKING_ID);

    expect(result.customValues).toEqual([
      { customFieldId: 'cf-1', label: 'Adat Pernikahan', nilai: 'Adat Jawa' },
    ]);
    expect(result.totalHarga).toBe(1_000_000);
  });
});

// OrdersService.confirm() dihapus (F06) — jembatan manual tanpa jejak Payment
// sudah pensiun. Transisi AWAITING_DP->CONFIRMED sekarang hanya lewat
// PaymentsService.confirmPayment / markCash, keduanya memakai
// BookingTransitionsService.confirmDpWithinTx yang sama — logika transisi
// (increment atomik, race condition, isolasi tenant) tetap tercakup penuh di
// booking-transitions.service.spec.ts dan payments.service.spec.ts.

describe('OrdersService.complete (F09, FR-F09-3)', () => {
  it.each([BookingStatus.CONFIRMED, BookingStatus.PAID])(
    'sukses dari %s -> COMPLETED',
    async (status) => {
      const { prisma, rawPrisma } = createPrismaMock();
      const slots = createSlotsServiceMock();
      rawPrisma.booking.findFirst
        .mockResolvedValueOnce({
          id: BOOKING_ID,
          clientId: CLIENT_ID,
          statusBooking: status,
        })
        .mockResolvedValueOnce({
          ...DETAIL_ROW,
          statusBooking: BookingStatus.COMPLETED,
        });
      rawPrisma.booking.updateMany.mockResolvedValue({ count: 1 });
      const transitions = createBookingTransitions();
      const service = new OrdersService(prisma, slots, transitions);

      const result = await service.complete(TENANT_ID, BOOKING_ID);

      expect(rawPrisma.booking.updateMany).toHaveBeenCalledWith({
        where: {
          id: BOOKING_ID,
          tenantId: TENANT_ID,
          statusBooking: { in: [BookingStatus.CONFIRMED, BookingStatus.PAID] },
        },
        data: { statusBooking: BookingStatus.COMPLETED },
      });
      expect(result.statusBooking).toBe(BookingStatus.COMPLETED);
    },
  );

  it.each([
    BookingStatus.AWAITING_DP,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELED,
    BookingStatus.EXPIRED,
  ])(
    '409 bila status saat ini %s (complete hanya valid dari CONFIRMED/PAID)',
    async (status) => {
      const { prisma, rawPrisma } = createPrismaMock();
      const slots = createSlotsServiceMock();
      rawPrisma.booking.findFirst.mockResolvedValueOnce({
        id: BOOKING_ID,
        clientId: CLIENT_ID,
        statusBooking: status,
      });
      const transitions = createBookingTransitions();
      const service = new OrdersService(prisma, slots, transitions);

      await expect(
        service.complete(TENANT_ID, BOOKING_ID),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(rawPrisma.booking.updateMany).not.toHaveBeenCalled();
    },
  );
});

describe('OrdersService.cancel (F09, FR-F09-3)', () => {
  const CANCEL_DTO: CancelOrderDto = { alasan: 'Klien membatalkan acara.' };

  it.each([
    BookingStatus.AWAITING_DP,
    BookingStatus.CONFIRMED,
    BookingStatus.PAID,
  ])(
    'sukses dari %s: set alasanBatal, canceledAt, holdUntil->null; totalBooking TIDAK di-decrement',
    async (status) => {
      const { prisma, rawPrisma } = createPrismaMock();
      const slots = createSlotsServiceMock();
      rawPrisma.booking.findFirst
        .mockResolvedValueOnce({
          id: BOOKING_ID,
          clientId: CLIENT_ID,
          statusBooking: status,
        })
        .mockResolvedValueOnce({
          ...DETAIL_ROW,
          statusBooking: BookingStatus.CANCELED,
        });
      rawPrisma.booking.updateMany.mockResolvedValue({ count: 1 });
      const transitions = createBookingTransitions();
      const service = new OrdersService(prisma, slots, transitions);

      await service.cancel(TENANT_ID, BOOKING_ID, CANCEL_DTO);

      expect(rawPrisma.booking.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: BOOKING_ID,
            tenantId: TENANT_ID,
          }),
          data: expect.objectContaining({
            statusBooking: BookingStatus.CANCELED,
            alasanBatal: CANCEL_DTO.alasan,
            holdUntil: null,
          }),
        }),
      );
      const callArg = rawPrisma.booking.updateMany.mock.calls[0][0];
      expect(callArg.data.canceledAt).toBeInstanceOf(Date);
      // Keputusan desain wajib: totalBooking adalah counter lifetime, TIDAK di-decrement saat cancel.
      expect(rawPrisma.client.update).not.toHaveBeenCalled();
    },
  );

  it.each([
    BookingStatus.COMPLETED,
    BookingStatus.CANCELED,
    BookingStatus.EXPIRED,
  ])('409 bila status sudah terminal (%s)', async (status) => {
    const { prisma, rawPrisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    rawPrisma.booking.findFirst.mockResolvedValueOnce({
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      statusBooking: status,
    });
    const transitions = createBookingTransitions();
    const service = new OrdersService(prisma, slots, transitions);

    await expect(
      service.cancel(TENANT_ID, BOOKING_ID, CANCEL_DTO),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(rawPrisma.booking.updateMany).not.toHaveBeenCalled();
  });
});

describe('OrdersService.reschedule (F09, AC-F09-2)', () => {
  const RESCHEDULE_DTO: RescheduleOrderDto = {
    tanggalAcara: '2026-08-01',
    jamMulai: 600, // 10:00
  };

  it('sukses: memanggil reserveSlotOrThrow dengan excludeBookingId=id, lalu update tanggalAcara', async () => {
    const { prisma, mockTx, rawPrisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    rawPrisma.booking.findFirst
      .mockResolvedValueOnce({
        id: BOOKING_ID,
        clientId: CLIENT_ID,
        statusBooking: BookingStatus.CONFIRMED,
        items: [{ durasi: 60 }, { durasi: 60 }],
      })
      .mockResolvedValueOnce(DETAIL_ROW);
    mockTx.booking.updateMany.mockResolvedValue({ count: 1 });
    const transitions = createBookingTransitions();
    const service = new OrdersService(prisma, slots, transitions);

    await service.reschedule(TENANT_ID, BOOKING_ID, RESCHEDULE_DTO);

    expect(slots.reserveSlotOrThrow).toHaveBeenCalledWith(
      mockTx,
      TENANT_ID,
      new Date('2026-08-01T10:00:00.000Z'),
      120, // total durasi item
      BOOKING_ID, // exclude diri sendiri — fix bug self-conflict
    );
    expect(mockTx.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: BOOKING_ID, tenantId: TENANT_ID }),
        data: { tanggalAcara: new Date('2026-08-01T10:00:00.000Z') },
      }),
    );
  });

  it('409 (propagate) bila reserveSlotOrThrow menolak karena slot penuh', async () => {
    const { prisma, mockTx, rawPrisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    slots.reserveSlotOrThrow.mockRejectedValue(
      new ConflictException('Slot baru saja terisi.'),
    );
    rawPrisma.booking.findFirst.mockResolvedValueOnce({
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      statusBooking: BookingStatus.CONFIRMED,
      items: [{ durasi: 60 }],
    });
    const transitions = createBookingTransitions();
    const service = new OrdersService(prisma, slots, transitions);

    await expect(
      service.reschedule(TENANT_ID, BOOKING_ID, RESCHEDULE_DTO),
    ).rejects.toThrow('Slot baru saja terisi.');
    expect(mockTx.booking.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    BookingStatus.COMPLETED,
    BookingStatus.CANCELED,
    BookingStatus.EXPIRED,
  ])(
    '409 bila status sudah terminal (%s) — reserveSlotOrThrow tidak dipanggil',
    async (status) => {
      const { prisma, rawPrisma } = createPrismaMock();
      const slots = createSlotsServiceMock();
      rawPrisma.booking.findFirst.mockResolvedValueOnce({
        id: BOOKING_ID,
        clientId: CLIENT_ID,
        statusBooking: status,
        items: [{ durasi: 60 }],
      });
      const transitions = createBookingTransitions();
      const service = new OrdersService(prisma, slots, transitions);

      await expect(
        service.reschedule(TENANT_ID, BOOKING_ID, RESCHEDULE_DTO),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(slots.reserveSlotOrThrow).not.toHaveBeenCalled();
    },
  );
});
