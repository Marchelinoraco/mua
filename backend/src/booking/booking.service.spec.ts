import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, DpTipe, Prisma, TenantStatus, TransportMode } from '@prisma/client';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../slots/slots.service';
import { CreateBookingDto } from './dto/create-booking.dto';

/**
 * Unit test BookingService (F04) — Prisma & SlotsService di-mock (pola sama
 * dengan storefront.service.spec.ts). `$transaction` di-mock supaya callback
 * yang berisi `reserveSlotOrThrow` + `client.upsert` + `booking.create`
 * benar-benar dieksekusi terhadap `mockTx` — logika retry kodeBooking &
 * propagasi ConflictException diuji lewat mock ini (bukan lewat DB nyata;
 * DB nyata diuji terpisah di booking.service.integration.spec.ts).
 */
function createPrismaMock() {
  const mockTx = {
    client: { upsert: jest.fn() },
    booking: { create: jest.fn() },
  };
  const prisma = {
    tenant: { findUnique: jest.fn() },
    service: { findMany: jest.fn() },
    customField: { findMany: jest.fn() },
    paymentProfile: { findUnique: jest.fn() },
    booking: { findUnique: jest.fn() },
    $transaction: jest.fn(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
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

const BASE_TENANT = {
  id: 'tenant-1',
  status: TenantStatus.ACTIVE,
  transportRule: null,
};

const SERVICE_RIAS = {
  id: 'svc-rias',
  nama: 'Riasan Pengantin',
  harga: 1_000_000,
  durasi: 120,
  dpTipe: DpTipe.PERSEN,
  dpNilai: 30,
  butuhTransport: false,
};

const BASE_DTO: CreateBookingDto = {
  serviceIds: ['svc-rias'],
  tanggalAcara: '2026-08-01',
  jamMulai: 570, // 09:30
  client: { nama: 'Klien Uji', phone: '081234567890' },
};

describe('BookingService.createBooking (F04)', () => {
  it('404 bila tenant (slug) tidak ditemukan', async () => {
    const { prisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(null);
    const service = new BookingService(prisma, slots);

    await expect(service.createBooking('tidak-ada', BASE_DTO)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(slots.reserveSlotOrThrow).not.toHaveBeenCalled();
  });

  it.each([TenantStatus.CANCELED, TenantStatus.RESTRICTED])(
    '404 bila tenant berstatus %s (tidak menerima booking)',
    async (status) => {
      const { prisma } = createPrismaMock();
      const slots = createSlotsServiceMock();
      prisma.tenant.findUnique = jest
        .fn()
        .mockResolvedValue({ ...BASE_TENANT, status });
      const service = new BookingService(prisma, slots);

      await expect(service.createBooking('sari-mua', BASE_DTO)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    },
  );

  it('400 bila ada serviceId yang tidak ditemukan/tidak aktif/bukan milik tenant', async () => {
    const { prisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(BASE_TENANT);
    prisma.service.findMany = jest.fn().mockResolvedValue([]); // tidak ketemu
    const service = new BookingService(prisma, slots);

    await expect(
      service.createBooking('sari-mua', { ...BASE_DTO, serviceIds: ['svc-rias'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(slots.reserveSlotOrThrow).not.toHaveBeenCalled();
  });

  it('400 bila custom field wajib tidak terisi — divalidasi sebelum transaksi (reserveSlotOrThrow tidak dipanggil)', async () => {
    const { prisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(BASE_TENANT);
    prisma.service.findMany = jest.fn().mockResolvedValue([SERVICE_RIAS]);
    prisma.customField.findMany = jest
      .fn()
      .mockResolvedValue([{ id: 'cf-1', label: 'Adat', wajib: true }]);
    const service = new BookingService(prisma, slots);

    await expect(service.createBooking('sari-mua', BASE_DTO)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(slots.reserveSlotOrThrow).not.toHaveBeenCalled();
  });

  it('happy path: hitung totalHarga/dpAmount benar, panggil reserveSlotOrThrow, buat client+booking, return kontrak lengkap', async () => {
    const { prisma, mockTx } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(BASE_TENANT);
    prisma.service.findMany = jest.fn().mockResolvedValue([SERVICE_RIAS]);
    prisma.customField.findMany = jest.fn().mockResolvedValue([]);
    prisma.paymentProfile.findUnique = jest.fn().mockResolvedValue({
      namaBank: 'BCA',
      nomorRekening: '1234567890',
      namaPemilik: 'Sari MUA',
      instruksiTambahan: null,
    });
    mockTx.client.upsert.mockResolvedValue({ id: 'client-1' });
    mockTx.booking.create.mockResolvedValue({
      kodeBooking: 'GB-20260801-AAAA',
      statusBooking: BookingStatus.AWAITING_DP,
      tanggalAcara: new Date('2026-08-01T09:30:00.000Z'),
      holdUntil: new Date('2026-08-01T11:30:00.000Z'),
      totalHarga: 1_000_000,
      dpAmount: 300_000,
      items: [
        { namaSnapshot: 'Riasan Pengantin', qty: 1, hargaSnapshot: 1_000_000, durasi: 120 },
      ],
    });

    const service = new BookingService(prisma, slots);
    const result = await service.createBooking('sari-mua', BASE_DTO);

    // Anti-bentrok WAJIB dipanggil dengan durasi total & tanggal gabungan yang benar.
    expect(slots.reserveSlotOrThrow).toHaveBeenCalledWith(
      mockTx,
      'tenant-1',
      new Date('2026-08-01T09:30:00.000Z'),
      120,
    );
    expect(mockTx.client.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_phone: { tenantId: 'tenant-1', phone: '081234567890' } },
        update: {},
      }),
    );
    expect(result).toEqual({
      kodeBooking: 'GB-20260801-AAAA',
      statusBooking: BookingStatus.AWAITING_DP,
      tanggalAcara: new Date('2026-08-01T09:30:00.000Z'),
      holdUntil: new Date('2026-08-01T11:30:00.000Z'),
      totalHarga: 1_000_000,
      dpAmount: 300_000,
      paymentProfile: {
        namaBank: 'BCA',
        nomorRekening: '1234567890',
        namaPemilik: 'Sari MUA',
        instruksiTambahan: null,
      },
      items: [
        { namaSnapshot: 'Riasan Pengantin', qty: 1, hargaSnapshot: 1_000_000, durasi: 120 },
      ],
    });
  });

  it('paymentProfile null bila MUA belum mengisi PaymentProfile', async () => {
    const { prisma, mockTx } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(BASE_TENANT);
    prisma.service.findMany = jest.fn().mockResolvedValue([SERVICE_RIAS]);
    prisma.customField.findMany = jest.fn().mockResolvedValue([]);
    prisma.paymentProfile.findUnique = jest.fn().mockResolvedValue(null);
    mockTx.client.upsert.mockResolvedValue({ id: 'client-1' });
    mockTx.booking.create.mockResolvedValue({
      kodeBooking: 'GB-20260801-AAAA',
      statusBooking: BookingStatus.AWAITING_DP,
      tanggalAcara: new Date('2026-08-01T09:30:00.000Z'),
      holdUntil: new Date('2026-08-01T11:30:00.000Z'),
      totalHarga: 1_000_000,
      dpAmount: 300_000,
      items: [],
    });

    const service = new BookingService(prisma, slots);
    const result = await service.createBooking('sari-mua', BASE_DTO);

    expect(result.paymentProfile).toBeNull();
  });

  it('transportFee hanya dihitung sekali & hanya bila salah satu service butuhTransport', async () => {
    const { prisma, mockTx } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue({
      ...BASE_TENANT,
      transportRule: { mode: TransportMode.FLAT, flatNominal: 50_000, zona: null },
    });
    prisma.service.findMany = jest
      .fn()
      .mockResolvedValue([{ ...SERVICE_RIAS, butuhTransport: true }]);
    prisma.customField.findMany = jest.fn().mockResolvedValue([]);
    prisma.paymentProfile.findUnique = jest.fn().mockResolvedValue(null);
    mockTx.client.upsert.mockResolvedValue({ id: 'client-1' });
    mockTx.booking.create.mockImplementation(
      (args: Prisma.BookingCreateArgs) =>
        Promise.resolve({
          kodeBooking: 'GB-20260801-AAAA',
          statusBooking: BookingStatus.AWAITING_DP,
          tanggalAcara: new Date('2026-08-01T09:30:00.000Z'),
          holdUntil: new Date('2026-08-01T11:30:00.000Z'),
          totalHarga: args.data.totalHarga,
          dpAmount: args.data.dpAmount,
          items: [],
        }),
    );

    const service = new BookingService(prisma, slots);
    const result = await service.createBooking('sari-mua', BASE_DTO);

    // totalHarga = 1_000_000 (harga) + 50_000 (transport flat, sekali)
    expect(result.totalHarga).toBe(1_050_000);
    // dpAmount TIDAK termasuk transport (30% dari harga jasa saja)
    expect(result.dpAmount).toBe(300_000);
  });

  it('ConflictException dari reserveSlotOrThrow (slot penuh) propagate 409 tanpa retry', async () => {
    const { prisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    slots.reserveSlotOrThrow.mockRejectedValue(
      new ConflictException('Slot baru saja terisi.'),
    );
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(BASE_TENANT);
    prisma.service.findMany = jest.fn().mockResolvedValue([SERVICE_RIAS]);
    prisma.customField.findMany = jest.fn().mockResolvedValue([]);
    const service = new BookingService(prisma, slots);

    await expect(service.createBooking('sari-mua', BASE_DTO)).rejects.toThrow(
      'Slot baru saja terisi.',
    );
    // Hanya 1 percobaan — ConflictException TIDAK di-retry.
    expect(slots.reserveSlotOrThrow).toHaveBeenCalledTimes(1);
  });

  it('retry kodeBooking saat P2002 (kodeBooking collision) lalu sukses di percobaan kedua', async () => {
    const { prisma, mockTx } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(BASE_TENANT);
    prisma.service.findMany = jest.fn().mockResolvedValue([SERVICE_RIAS]);
    prisma.customField.findMany = jest.fn().mockResolvedValue([]);
    prisma.paymentProfile.findUnique = jest.fn().mockResolvedValue(null);
    mockTx.client.upsert.mockResolvedValue({ id: 'client-1' });

    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['kodeBooking'] },
    });
    mockTx.booking.create
      .mockRejectedValueOnce(p2002)
      .mockResolvedValueOnce({
        kodeBooking: 'GB-20260801-BBBB',
        statusBooking: BookingStatus.AWAITING_DP,
        tanggalAcara: new Date('2026-08-01T09:30:00.000Z'),
        holdUntil: new Date('2026-08-01T11:30:00.000Z'),
        totalHarga: 1_000_000,
        dpAmount: 300_000,
        items: [],
      });

    const service = new BookingService(prisma, slots);
    const result = await service.createBooking('sari-mua', BASE_DTO);

    expect(result.kodeBooking).toBe('GB-20260801-BBBB');
    expect(mockTx.booking.create).toHaveBeenCalledTimes(2);
    // reserveSlotOrThrow diulang juga karena percobaan mengulang SELURUH transaksi.
    expect(slots.reserveSlotOrThrow).toHaveBeenCalledTimes(2);
  });

  it('setelah 5x collision kodeBooking berturut-turut -> 500 InternalServerErrorException', async () => {
    const { prisma, mockTx } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.tenant.findUnique = jest.fn().mockResolvedValue(BASE_TENANT);
    prisma.service.findMany = jest.fn().mockResolvedValue([SERVICE_RIAS]);
    prisma.customField.findMany = jest.fn().mockResolvedValue([]);
    mockTx.client.upsert.mockResolvedValue({ id: 'client-1' });

    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['kodeBooking'] },
    });
    mockTx.booking.create.mockRejectedValue(p2002);

    const service = new BookingService(prisma, slots);

    await expect(service.createBooking('sari-mua', BASE_DTO)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(mockTx.booking.create).toHaveBeenCalledTimes(5);
  });
});

describe('BookingService.getBookingStatus (F04, FR-F04-7)', () => {
  const BOOKING_ROW = {
    tenantId: 'tenant-1',
    kodeBooking: 'GB-20260801-AAAA',
    statusBooking: BookingStatus.AWAITING_DP,
    tanggalAcara: new Date('2026-08-01T09:30:00.000Z'),
    holdUntil: new Date('2026-08-01T11:30:00.000Z'),
    lokasiAcara: 'Rumah klien',
    catatan: null,
    totalHarga: 1_000_000,
    dpAmount: 300_000,
    client: { nama: 'Klien Uji', phone: '081234567890', email: null },
    items: [
      { namaSnapshot: 'Riasan Pengantin', qty: 1, hargaSnapshot: 1_000_000, durasi: 120 },
    ],
  };

  it('404 bila kode tidak ditemukan', async () => {
    const { prisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.booking.findUnique = jest.fn().mockResolvedValue(null);
    const service = new BookingService(prisma, slots);

    await expect(service.getBookingStatus('GB-TIDAK-ADA')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('tanpa ?phone= -> hanya info minimal, TIDAK bocorkan nama/harga/lokasi', async () => {
    const { prisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.booking.findUnique = jest.fn().mockResolvedValue(BOOKING_ROW);
    const service = new BookingService(prisma, slots);

    const result = await service.getBookingStatus('GB-20260801-AAAA');

    expect(result).toEqual({
      requiresOtp: true,
      kodeBooking: 'GB-20260801-AAAA',
      statusBooking: BookingStatus.AWAITING_DP,
      tanggalAcara: new Date('2026-08-01T09:30:00.000Z'),
    });
    expect(Object.keys(result)).toEqual([
      'requiresOtp',
      'kodeBooking',
      'statusBooking',
      'tanggalAcara',
    ]);
  });

  it('?phone= tidak cocok -> tetap minimal', async () => {
    const { prisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.booking.findUnique = jest.fn().mockResolvedValue(BOOKING_ROW);
    const service = new BookingService(prisma, slots);

    const result = await service.getBookingStatus('GB-20260801-AAAA', '089999999999');

    expect(result.requiresOtp).toBe(true);
  });

  it('?phone= cocok (workaround sementara) -> detail penuh + paymentProfile', async () => {
    const { prisma } = createPrismaMock();
    const slots = createSlotsServiceMock();
    prisma.booking.findUnique = jest.fn().mockResolvedValue(BOOKING_ROW);
    prisma.paymentProfile.findUnique = jest.fn().mockResolvedValue({
      namaBank: 'BCA',
      nomorRekening: '1234567890',
      namaPemilik: 'Sari MUA',
      instruksiTambahan: 'Kirim bukti via WA.',
    });
    const service = new BookingService(prisma, slots);

    const result = await service.getBookingStatus('GB-20260801-AAAA', '081234567890');

    expect(result).toEqual({
      requiresOtp: false,
      kodeBooking: 'GB-20260801-AAAA',
      statusBooking: BookingStatus.AWAITING_DP,
      tanggalAcara: new Date('2026-08-01T09:30:00.000Z'),
      holdUntil: new Date('2026-08-01T11:30:00.000Z'),
      lokasiAcara: 'Rumah klien',
      catatan: null,
      totalHarga: 1_000_000,
      dpAmount: 300_000,
      client: { nama: 'Klien Uji', phone: '081234567890', email: null },
      items: [
        { namaSnapshot: 'Riasan Pengantin', qty: 1, hargaSnapshot: 1_000_000, durasi: 120 },
      ],
      paymentProfile: {
        namaBank: 'BCA',
        nomorRekening: '1234567890',
        namaPemilik: 'Sari MUA',
        instruksiTambahan: 'Kirim bukti via WA.',
      },
    });
  });
});
