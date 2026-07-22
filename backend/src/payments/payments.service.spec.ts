import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import {
  ALLOWED_BUKTI_MIME_TYPES,
  MAX_BUKTI_FILE_SIZE_BYTES,
  PaymentsService,
} from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlobStorageService } from './blob-storage.service';
import { BookingTransitionsService } from '../orders/booking-transitions.service';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentUploadDto } from './dto/create-payment-upload.dto';
import { MarkCashPaymentDto } from './dto/mark-cash-payment.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';

/**
 * Unit test PaymentsService (F06) — Prisma, BlobStorageService (jadi @vercel/blob
 * TIDAK pernah dipanggil sungguhan di sini), BookingTransitionsService, dan
 * OrdersService semua di-mock. Pola sama dengan orders.service.spec.ts:
 * `$transaction` di-mock supaya callback benar-benar dieksekusi terhadap
 * `mockTx`, sehingga urutan operasi di dalam SATU transaksi (guard Payment
 * lalu transisi Booking) benar-benar teruji, bukan cuma diklaim.
 *
 * BookingTransitionsService di-mock (BUKAN dipakai apa adanya seperti di
 * orders.service.spec.ts) karena cakupannya sendiri (guard race, pesan 409)
 * sudah diuji terpisah di booking-transitions.service.spec.ts — di sini kita
 * hanya perlu memverifikasi PaymentsService MEMANGGILNYA dengan argumen yang
 * benar untuk tipe DP vs PELUNASAN, dan bahwa error darinya membatalkan
 * seluruh transaksi (Payment row tidak ikut ter-commit).
 */
function createPrismaMock() {
  const mockTx = {
    payment: { updateMany: jest.fn(), create: jest.fn() },
  };
  const prisma = {
    booking: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
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

function createBlobStorageMock() {
  return {
    uploadBuktiTransfer: jest
      .fn()
      .mockResolvedValue('https://blob.example/bukti.jpg'),
  } as unknown as BlobStorageService & { uploadBuktiTransfer: jest.Mock };
}

function createBookingTransitionsMock() {
  return {
    confirmDpWithinTx: jest.fn().mockResolvedValue(undefined),
    confirmPelunasanWithinTx: jest.fn().mockResolvedValue(undefined),
  } as unknown as BookingTransitionsService & {
    confirmDpWithinTx: jest.Mock;
    confirmPelunasanWithinTx: jest.Mock;
  };
}

const ORDER_DETAIL_STUB = {
  id: 'booking-1',
  statusBooking: BookingStatus.CONFIRMED,
};

function createOrdersServiceMock() {
  return {
    detail: jest.fn().mockResolvedValue(ORDER_DETAIL_STUB),
  } as unknown as OrdersService & { detail: jest.Mock };
}

const TENANT_ID = 'tenant-1';
const BOOKING_ID = 'booking-1';
const CLIENT_ID = 'client-1';
const PAYMENT_ID = 'payment-1';

function createValidFile(
  overrides?: Partial<Express.Multer.File>,
): Express.Multer.File {
  return {
    fieldname: 'bukti',
    originalname: 'bukti.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('fake-image-bytes'),
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

describe('PaymentsService.uploadBukti (F06, publik)', () => {
  const DTO: CreatePaymentUploadDto = {
    tipe: 'DP',
    jumlah: 300_000,
    phone: '081234567890',
    catatanKlien: 'Sudah transfer',
  };

  it('400 bila file tidak dikirim', async () => {
    const { prisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.uploadBukti('GB-1', DTO, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['application/zip', 'text/plain', 'video/mp4'])(
    '400 bila mime type tidak didukung (%s)',
    async (mimetype) => {
      const { prisma } = createPrismaMock();
      const blob = createBlobStorageMock();
      const transitions = createBookingTransitionsMock();
      const orders = createOrdersServiceMock();
      const service = new PaymentsService(prisma, blob, transitions, orders);

      await expect(
        service.uploadBukti('GB-1', DTO, createValidFile({ mimetype })),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it.each(ALLOWED_BUKTI_MIME_TYPES)(
    'menerima mime type %s (whitelist)',
    async (mimetype) => {
      const { prisma, rawPrisma } = createPrismaMock();
      const blob = createBlobStorageMock();
      const transitions = createBookingTransitionsMock();
      const orders = createOrdersServiceMock();
      rawPrisma.booking.findUnique.mockResolvedValue({
        id: BOOKING_ID,
        tenantId: TENANT_ID,
        statusBooking: BookingStatus.AWAITING_DP,
        client: { phone: DTO.phone },
      });
      rawPrisma.payment.create.mockResolvedValue({
        id: PAYMENT_ID,
        tipe: 'DP',
        jumlah: 300_000,
        status: PaymentStatus.SUBMITTED,
        buktiFotoUrl: 'https://blob.example/bukti.jpg',
        createdAt: new Date('2026-07-22T00:00:00.000Z'),
      });
      const service = new PaymentsService(prisma, blob, transitions, orders);

      await expect(
        service.uploadBukti('GB-1', DTO, createValidFile({ mimetype })),
      ).resolves.toMatchObject({ status: PaymentStatus.SUBMITTED });
    },
  );

  it('400 bila ukuran file melebihi 5MB', async () => {
    const { prisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.uploadBukti(
        'GB-1',
        DTO,
        createValidFile({ size: MAX_BUKTI_FILE_SIZE_BYTES + 1 }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('menerima file tepat di batas 5MB', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findUnique.mockResolvedValue({
      id: BOOKING_ID,
      tenantId: TENANT_ID,
      statusBooking: BookingStatus.AWAITING_DP,
      client: { phone: DTO.phone },
    });
    rawPrisma.payment.create.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'DP',
      jumlah: 300_000,
      status: PaymentStatus.SUBMITTED,
      buktiFotoUrl: 'https://blob.example/bukti.jpg',
      createdAt: new Date(),
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.uploadBukti(
        'GB-1',
        DTO,
        createValidFile({ size: MAX_BUKTI_FILE_SIZE_BYTES }),
      ),
    ).resolves.toBeDefined();
  });

  it('404 bila kodeBooking tidak ditemukan', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findUnique.mockResolvedValue(null);
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.uploadBukti('GB-TIDAK-ADA', DTO, createValidFile()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404 (BUKAN 403) bila phone tidak cocok — hindari bocor eksistensi booking', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findUnique.mockResolvedValue({
      id: BOOKING_ID,
      tenantId: TENANT_ID,
      statusBooking: BookingStatus.AWAITING_DP,
      client: { phone: '089999999999' },
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.uploadBukti('GB-1', DTO, createValidFile()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(blob.uploadBuktiTransfer).not.toHaveBeenCalled();
  });

  it('409 bila tipe=DP tapi booking bukan AWAITING_DP', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findUnique.mockResolvedValue({
      id: BOOKING_ID,
      tenantId: TENANT_ID,
      statusBooking: BookingStatus.CONFIRMED,
      client: { phone: DTO.phone },
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.uploadBukti('GB-1', DTO, createValidFile()),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('409 bila tipe=PELUNASAN tapi booking bukan CONFIRMED', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findUnique.mockResolvedValue({
      id: BOOKING_ID,
      tenantId: TENANT_ID,
      statusBooking: BookingStatus.AWAITING_DP,
      client: { phone: DTO.phone },
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.uploadBukti(
        'GB-1',
        { ...DTO, tipe: 'PELUNASAN' },
        createValidFile(),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('sukses: upload ke Blob lalu create Payment(status=SUBMITTED) dengan tenantId dari booking', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findUnique.mockResolvedValue({
      id: BOOKING_ID,
      tenantId: TENANT_ID,
      statusBooking: BookingStatus.AWAITING_DP,
      client: { phone: DTO.phone },
    });
    rawPrisma.payment.create.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'DP',
      jumlah: 300_000,
      status: PaymentStatus.SUBMITTED,
      buktiFotoUrl: 'https://blob.example/bukti.jpg',
      createdAt: new Date('2026-07-22T00:00:00.000Z'),
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    const result = await service.uploadBukti('GB-1', DTO, createValidFile());

    expect(blob.uploadBuktiTransfer).toHaveBeenCalledWith(
      BOOKING_ID,
      expect.objectContaining({ mimetype: 'image/jpeg' }),
    );
    expect(rawPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: TENANT_ID,
          bookingId: BOOKING_ID,
          tipe: 'DP',
          jumlah: 300_000,
          status: PaymentStatus.SUBMITTED,
          buktiFotoUrl: 'https://blob.example/bukti.jpg',
          catatanKlien: 'Sudah transfer',
        }),
      }),
    );
    expect(result).toEqual({
      id: PAYMENT_ID,
      tipe: 'DP',
      jumlah: 300_000,
      status: PaymentStatus.SUBMITTED,
      buktiFotoUrl: 'https://blob.example/bukti.jpg',
      createdAt: new Date('2026-07-22T00:00:00.000Z'),
    });
  });
});

describe('PaymentsService.confirmPayment (F06, dashboard, isolasi tenant)', () => {
  it('404 bila payment tidak ditemukan (salah tenant/booking/id)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue(null);
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.confirmPayment(TENANT_ID, BOOKING_ID, PAYMENT_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(rawPrisma.payment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PAYMENT_ID, tenantId: TENANT_ID, bookingId: BOOKING_ID },
      }),
    );
  });

  it('409 bila Payment.status bukan SUBMITTED', async () => {
    const { prisma, rawPrisma, mockTx } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'DP',
      status: PaymentStatus.CONFIRMED,
      booking: { clientId: CLIENT_ID },
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.confirmPayment(TENANT_ID, BOOKING_ID, PAYMENT_ID),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mockTx.payment.updateMany).not.toHaveBeenCalled();
  });

  it('tipe=DP sukses: updateMany Payment->CONFIRMED lalu confirmDpWithinTx, kembalikan OrdersService.detail', async () => {
    const { prisma, rawPrisma, mockTx } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'DP',
      status: PaymentStatus.SUBMITTED,
      booking: { clientId: CLIENT_ID },
    });
    mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    const result = await service.confirmPayment(
      TENANT_ID,
      BOOKING_ID,
      PAYMENT_ID,
    );

    expect(mockTx.payment.updateMany).toHaveBeenCalledWith({
      where: {
        id: PAYMENT_ID,
        tenantId: TENANT_ID,
        status: PaymentStatus.SUBMITTED,
      },
      data: { status: PaymentStatus.CONFIRMED, confirmedAt: expect.any(Date) },
    });
    expect(transitions.confirmDpWithinTx).toHaveBeenCalledWith(
      mockTx,
      TENANT_ID,
      BOOKING_ID,
      CLIENT_ID,
    );
    expect(transitions.confirmPelunasanWithinTx).not.toHaveBeenCalled();
    expect(orders.detail).toHaveBeenCalledWith(TENANT_ID, BOOKING_ID);
    expect(result).toBe(ORDER_DETAIL_STUB);
  });

  it('tipe=PELUNASAN sukses: memanggil confirmPelunasanWithinTx (bukan confirmDpWithinTx)', async () => {
    const { prisma, rawPrisma, mockTx } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'PELUNASAN',
      status: PaymentStatus.SUBMITTED,
      booking: { clientId: CLIENT_ID },
    });
    mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await service.confirmPayment(TENANT_ID, BOOKING_ID, PAYMENT_ID);

    expect(transitions.confirmPelunasanWithinTx).toHaveBeenCalledWith(
      mockTx,
      TENANT_ID,
      BOOKING_ID,
    );
    expect(transitions.confirmDpWithinTx).not.toHaveBeenCalled();
  });

  it('409 (race) bila updateMany Payment count=0 — transisi Booking TIDAK dipanggil', async () => {
    const { prisma, rawPrisma, mockTx } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'DP',
      status: PaymentStatus.SUBMITTED,
      booking: { clientId: CLIENT_ID },
    });
    mockTx.payment.updateMany.mockResolvedValue({ count: 0 });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.confirmPayment(TENANT_ID, BOOKING_ID, PAYMENT_ID),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transitions.confirmDpWithinTx).not.toHaveBeenCalled();
  });

  it('409 (rollback) bila confirmDpWithinTx menolak — mencegah double-confirm DP', async () => {
    const { prisma, rawPrisma, mockTx } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'DP',
      status: PaymentStatus.SUBMITTED,
      booking: { clientId: CLIENT_ID },
    });
    mockTx.payment.updateMany.mockResolvedValue({ count: 1 });
    transitions.confirmDpWithinTx.mockRejectedValue(
      new ConflictException(
        'Booking harus berstatus AWAITING_DP untuk konfirmasi DP.',
      ),
    );
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.confirmPayment(TENANT_ID, BOOKING_ID, PAYMENT_ID),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(orders.detail).not.toHaveBeenCalled();
  });
});

describe('PaymentsService.rejectPayment (F06, dashboard)', () => {
  const REJECT_DTO: RejectPaymentDto = { alasan: 'Nominal tidak sesuai.' };

  it('404 bila payment tidak ditemukan', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue(null);
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.rejectPayment(TENANT_ID, BOOKING_ID, PAYMENT_ID, REJECT_DTO),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('409 bila Payment.status bukan SUBMITTED', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'DP',
      status: PaymentStatus.REJECTED,
      booking: { clientId: CLIENT_ID },
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.rejectPayment(TENANT_ID, BOOKING_ID, PAYMENT_ID, REJECT_DTO),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(rawPrisma.payment.updateMany).not.toHaveBeenCalled();
  });

  it('sukses: Payment->REJECTED + catatanMua=alasan; Booking TIDAK berubah', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'DP',
      status: PaymentStatus.SUBMITTED,
      booking: { clientId: CLIENT_ID },
    });
    rawPrisma.payment.updateMany.mockResolvedValue({ count: 1 });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    const result = await service.rejectPayment(
      TENANT_ID,
      BOOKING_ID,
      PAYMENT_ID,
      REJECT_DTO,
    );

    expect(rawPrisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        id: PAYMENT_ID,
        tenantId: TENANT_ID,
        status: PaymentStatus.SUBMITTED,
      },
      data: { status: PaymentStatus.REJECTED, catatanMua: REJECT_DTO.alasan },
    });
    expect(transitions.confirmDpWithinTx).not.toHaveBeenCalled();
    expect(transitions.confirmPelunasanWithinTx).not.toHaveBeenCalled();
    expect(result).toBe(ORDER_DETAIL_STUB);
  });

  it('409 (race) bila updateMany count=0', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.payment.findFirst.mockResolvedValue({
      id: PAYMENT_ID,
      tipe: 'DP',
      status: PaymentStatus.SUBMITTED,
      booking: { clientId: CLIENT_ID },
    });
    rawPrisma.payment.updateMany.mockResolvedValue({ count: 0 });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.rejectPayment(TENANT_ID, BOOKING_ID, PAYMENT_ID, REJECT_DTO),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('PaymentsService.markCash (F06, FR-F06-7, dashboard)', () => {
  const MARK_CASH_DP: MarkCashPaymentDto = { tipe: 'DP', jumlah: 300_000 };
  const MARK_CASH_PELUNASAN: MarkCashPaymentDto = {
    tipe: 'PELUNASAN',
    jumlah: 700_000,
    catatanMua: 'Lunas tunai di venue.',
  };

  it('404 bila booking tidak ditemukan / bukan milik tenant', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findFirst.mockResolvedValue(null);
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.markCash(TENANT_ID, BOOKING_ID, MARK_CASH_DP),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('409 bila tipe=DP tapi booking bukan AWAITING_DP', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findFirst.mockResolvedValue({
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      statusBooking: BookingStatus.CONFIRMED,
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.markCash(TENANT_ID, BOOKING_ID, MARK_CASH_DP),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('409 bila tipe=PELUNASAN tapi booking bukan CONFIRMED', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findFirst.mockResolvedValue({
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      statusBooking: BookingStatus.AWAITING_DP,
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.markCash(TENANT_ID, BOOKING_ID, MARK_CASH_PELUNASAN),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('tipe=DP sukses: create Payment(status=CONFIRMED, buktiFotoUrl tidak diset) lalu confirmDpWithinTx', async () => {
    const { prisma, rawPrisma, mockTx } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findFirst.mockResolvedValue({
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      statusBooking: BookingStatus.AWAITING_DP,
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    const result = await service.markCash(TENANT_ID, BOOKING_ID, MARK_CASH_DP);

    expect(mockTx.payment.create).toHaveBeenCalledWith({
      data: {
        tenantId: TENANT_ID,
        bookingId: BOOKING_ID,
        tipe: 'DP',
        jumlah: 300_000,
        status: PaymentStatus.CONFIRMED,
        catatanMua: null,
        confirmedAt: expect.any(Date),
      },
    });
    expect(transitions.confirmDpWithinTx).toHaveBeenCalledWith(
      mockTx,
      TENANT_ID,
      BOOKING_ID,
      CLIENT_ID,
    );
    expect(blob.uploadBuktiTransfer).not.toHaveBeenCalled();
    expect(result).toBe(ORDER_DETAIL_STUB);
  });

  it('tipe=PELUNASAN sukses: confirmPelunasanWithinTx dipanggil dengan catatanMua tersimpan', async () => {
    const { prisma, rawPrisma, mockTx } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findFirst.mockResolvedValue({
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      statusBooking: BookingStatus.CONFIRMED,
    });
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await service.markCash(TENANT_ID, BOOKING_ID, MARK_CASH_PELUNASAN);

    expect(mockTx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipe: 'PELUNASAN',
          catatanMua: 'Lunas tunai di venue.',
        }),
      }),
    );
    expect(transitions.confirmPelunasanWithinTx).toHaveBeenCalledWith(
      mockTx,
      TENANT_ID,
      BOOKING_ID,
    );
    expect(transitions.confirmDpWithinTx).not.toHaveBeenCalled();
  });

  it('409 (rollback) bila confirmDpWithinTx menolak di dalam tx (race status booking)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const blob = createBlobStorageMock();
    const transitions = createBookingTransitionsMock();
    const orders = createOrdersServiceMock();
    rawPrisma.booking.findFirst.mockResolvedValue({
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      statusBooking: BookingStatus.AWAITING_DP,
    });
    transitions.confirmDpWithinTx.mockRejectedValue(
      new ConflictException(
        'Booking harus berstatus AWAITING_DP untuk konfirmasi DP.',
      ),
    );
    const service = new PaymentsService(prisma, blob, transitions, orders);

    await expect(
      service.markCash(TENANT_ID, BOOKING_ID, MARK_CASH_DP),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(orders.detail).not.toHaveBeenCalled();
  });
});
