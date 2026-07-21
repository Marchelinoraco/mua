import { NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';

/** Unit test ClientsService (F09) — Prisma di-mock, pola sama dengan blocked-dates.service.spec.ts. */
function createPrismaMock() {
  const prisma = {
    client: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      groupBy: jest.fn(),
    },
  };
  return { prisma: prisma as unknown as PrismaService, rawPrisma: prisma };
}

const TENANT_ID = 'tenant-1';

describe('ClientsService.list (F09, FR-F09-4)', () => {
  it('memfilter tenantId + q, urut nama asc, dan menghitung jumlahBookingAktif via satu groupBy (bukan N+1)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.client.count.mockResolvedValue(2);
    rawPrisma.client.findMany.mockResolvedValue([
      {
        id: 'c-1',
        nama: 'Ani',
        phone: '0811',
        email: null,
        totalBooking: 3,
        createdAt: new Date(),
      },
      {
        id: 'c-2',
        nama: 'Budi',
        phone: '0812',
        email: null,
        totalBooking: 0,
        createdAt: new Date(),
      },
    ]);
    rawPrisma.booking.groupBy.mockResolvedValue([
      { clientId: 'c-1', _count: { _all: 2 } },
    ]);
    const service = new ClientsService(prisma);

    const result = await service.list(TENANT_ID, 'ani', '1', '20');

    expect(rawPrisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT_ID,
          OR: expect.any(Array),
        }),
        orderBy: { nama: 'asc' },
        skip: 0,
        take: 20,
      }),
    );
    expect(rawPrisma.booking.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['clientId'],
        where: expect.objectContaining({
          tenantId: TENANT_ID,
          clientId: { in: ['c-1', 'c-2'] },
          statusBooking: {
            in: [
              BookingStatus.AWAITING_DP,
              BookingStatus.CONFIRMED,
              BookingStatus.PAID,
            ],
          },
        }),
      }),
    );
    expect(result.data).toEqual([
      expect.objectContaining({ id: 'c-1', jumlahBookingAktif: 2 }),
      expect.objectContaining({ id: 'c-2', jumlahBookingAktif: 0 }),
    ]);
    expect(result.total).toBe(2);
  });

  it('tidak memanggil groupBy bila hasil list kosong (menghindari query sia-sia)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.client.count.mockResolvedValue(0);
    rawPrisma.client.findMany.mockResolvedValue([]);
    const service = new ClientsService(prisma);

    const result = await service.list(TENANT_ID);

    expect(rawPrisma.booking.groupBy).not.toHaveBeenCalled();
    expect(result.data).toEqual([]);
  });
});

describe('ClientsService.detail (F09, isolasi tenant)', () => {
  it('404 bila klien tidak ditemukan / milik tenant lain', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.client.findFirst.mockResolvedValue(null);
    const service = new ClientsService(prisma);

    await expect(
      service.detail(TENANT_ID, 'client-milik-tenant-lain'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(rawPrisma.client.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'client-milik-tenant-lain', tenantId: TENANT_ID },
      }),
    );
  });

  it('mengembalikan profil + riwayat booking (totalHarga Decimal->number)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.client.findFirst.mockResolvedValue({
      id: 'c-1',
      nama: 'Ani',
      phone: '0811',
      email: null,
      catatan: 'Alergi lateks',
      totalBooking: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      bookings: [
        {
          id: 'b-1',
          kodeBooking: 'GB-20260101-AAAA',
          tanggalAcara: new Date('2026-01-01T09:00:00.000Z'),
          statusBooking: BookingStatus.COMPLETED,
          totalHarga: 500_000,
        },
      ],
    });
    const service = new ClientsService(prisma);

    const result = await service.detail(TENANT_ID, 'c-1');

    expect(result.catatan).toBe('Alergi lateks');
    expect(result.bookings).toEqual([
      expect.objectContaining({ id: 'b-1', totalHarga: 500_000 }),
    ]);
  });
});

describe('ClientsService.updateNotes (F09, FR-F09-5)', () => {
  it('404 bila klien tidak ditemukan / milik tenant lain — update TIDAK dipanggil', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.client.findFirst.mockResolvedValue(null);
    const service = new ClientsService(prisma);

    await expect(
      service.updateNotes(TENANT_ID, 'client-lain', { catatan: 'test' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(rawPrisma.client.update).not.toHaveBeenCalled();
  });

  it('sukses: update catatan (termasuk null untuk menghapus)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.client.findFirst.mockResolvedValue({ id: 'c-1' });
    rawPrisma.client.update.mockResolvedValue({
      id: 'c-1',
      nama: 'Ani',
      phone: '0811',
      email: null,
      catatan: null,
      totalBooking: 1,
      createdAt: new Date(),
    });
    const service = new ClientsService(prisma);

    const result = await service.updateNotes(TENANT_ID, 'c-1', {
      catatan: null,
    });

    expect(rawPrisma.client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c-1' },
        data: { catatan: null },
      }),
    );
    expect(result.catatan).toBeNull();
  });
});
