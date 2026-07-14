import { BadRequestException, ConflictException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { BlockedDatesService } from './blocked-dates.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit test BlockedDatesService.create() — edge case F05 §9 / AC terkait:
 * "MUA blokir tanggal yang sudah ada booking confirmed → tolak 409".
 *
 * Prisma di-mock (bukan DB nyata) — beda dengan
 * `slots/slots.service.integration.spec.ts` yang sengaja butuh Postgres asli
 * untuk menguji `pg_advisory_xact_lock`. Di sini logikanya murni "hitung
 * booking count lalu throw" — tidak ada primitif DB yang tidak bisa dimock,
 * jadi mock lebih cepat & deterministik tanpa bergantung Neon dev.
 */
function createPrismaMock() {
  return {
    booking: {
      count: jest.fn(),
    },
    blockedDate: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as PrismaService & {
    booking: { count: jest.Mock };
    blockedDate: { create: jest.Mock; findMany: jest.Mock };
  };
}

describe('BlockedDatesService.create (F05 §9 edge case)', () => {
  const tenantId = 'tenant-1';

  it('menolak (409 ConflictException) bila rentang beririsan booking CONFIRMED/PAID', async () => {
    const prisma = createPrismaMock();
    prisma.booking.count.mockResolvedValue(1); // ada booking aktif yang bentrok
    const service = new BlockedDatesService(prisma);

    await expect(
      service.create(tenantId, {
        tanggalMulai: '2026-08-01',
        tanggalSelesai: '2026-08-03',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    // blockedDate TIDAK boleh terbuat saat ditolak.
    expect(prisma.blockedDate.create).not.toHaveBeenCalled();

    // Query count harus memfilter status CONFIRMED/PAID pada rentang yang diminta.
    expect(prisma.booking.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          statusBooking: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PAID],
          },
        }),
      }),
    );
  });

  it('mengizinkan blokir (create dipanggil) bila tidak ada booking terkonfirmasi yang bentrok', async () => {
    const prisma = createPrismaMock();
    prisma.booking.count.mockResolvedValue(0);
    prisma.blockedDate.create.mockResolvedValue({
      id: 'bd-1',
      tanggalMulai: new Date('2026-08-01T00:00:00.000Z'),
      tanggalSelesai: new Date('2026-08-03T00:00:00.000Z'),
      alasan: 'Libur',
      createdAt: new Date(),
    });
    const service = new BlockedDatesService(prisma);

    const result = await service.create(tenantId, {
      tanggalMulai: '2026-08-01',
      tanggalSelesai: '2026-08-03',
      alasan: 'Libur',
    });

    expect(result.id).toBe('bd-1');
    expect(prisma.blockedDate.create).toHaveBeenCalledTimes(1);
  });

  it('menolak (400 BadRequestException) bila tanggalMulai setelah tanggalSelesai', async () => {
    const prisma = createPrismaMock();
    const service = new BlockedDatesService(prisma);

    await expect(
      service.create(tenantId, {
        tanggalMulai: '2026-08-10',
        tanggalSelesai: '2026-08-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Tidak boleh sampai query DB kalau validasi tanggal saja sudah gagal.
    expect(prisma.booking.count).not.toHaveBeenCalled();
    expect(prisma.blockedDate.create).not.toHaveBeenCalled();
  });

  it('booking AWAITING_DP (hold, belum confirmed) TIDAK menghalangi blokir tanggal', async () => {
    // Konfirmasi bahwa filter status hanya CONFIRMED/PAID, bukan "semua booking
    // hidup" — sesuai desain: hanya konfirmasi permanen yang menghalangi blokir.
    const prisma = createPrismaMock();
    prisma.booking.count.mockResolvedValue(0); // service query sudah difilter status di WHERE,
    // jadi count=0 di sini merepresentasikan "tidak ada match CONFIRMED/PAID"
    // walau mungkin ada booking AWAITING_DP di tanggal yang sama.
    prisma.blockedDate.create.mockResolvedValue({
      id: 'bd-2',
      tanggalMulai: new Date('2026-09-01T00:00:00.000Z'),
      tanggalSelesai: new Date('2026-09-01T00:00:00.000Z'),
      alasan: null,
      createdAt: new Date(),
    });
    const service = new BlockedDatesService(prisma);

    await expect(
      service.create(tenantId, {
        tanggalMulai: '2026-09-01',
        tanggalSelesai: '2026-09-01',
      }),
    ).resolves.toMatchObject({ id: 'bd-2' });

    const whereArg = prisma.booking.count.mock.calls[0][0].where;
    expect(whereArg.statusBooking.in).not.toContain(BookingStatus.AWAITING_DP);
  });
});
