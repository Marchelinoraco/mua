import { WilayahService } from './wilayah.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit test WilayahService — Prisma di-mock (data referensi [global], tidak
 * ada logika tenant-scoping untuk diuji di sini; fokus: query shape yang
 * benar — orderBy nama asc & filter provinceId).
 */
function createPrismaMock() {
  return {
    province: {
      findMany: jest.fn(),
    },
    regency: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService & {
    province: { findMany: jest.Mock };
    regency: { findMany: jest.Mock };
  };
}

describe('WilayahService.listProvinces', () => {
  it('mengembalikan provinsi urut nama asc, hanya field id/kode/nama', async () => {
    const prisma = createPrismaMock();
    prisma.province.findMany.mockResolvedValue([
      { id: 'p1', kode: '31', nama: 'DKI Jakarta' },
      { id: 'p2', kode: '32', nama: 'Jawa Barat' },
    ]);
    const service = new WilayahService(prisma);

    const result = await service.listProvinces();

    expect(result).toEqual([
      { id: 'p1', kode: '31', nama: 'DKI Jakarta' },
      { id: 'p2', kode: '32', nama: 'Jawa Barat' },
    ]);
    expect(prisma.province.findMany).toHaveBeenCalledWith({
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    });
  });
});

describe('WilayahService.listRegencies', () => {
  it('memfilter berdasarkan provinceId dan urut nama asc', async () => {
    const prisma = createPrismaMock();
    prisma.regency.findMany.mockResolvedValue([
      { id: 'r1', kode: '3201', nama: 'Kab. Bogor' },
      { id: 'r2', kode: '3273', nama: 'Kota Bandung' },
    ]);
    const service = new WilayahService(prisma);

    const result = await service.listRegencies('prov-32');

    expect(result).toEqual([
      { id: 'r1', kode: '3201', nama: 'Kab. Bogor' },
      { id: 'r2', kode: '3273', nama: 'Kota Bandung' },
    ]);
    expect(prisma.regency.findMany).toHaveBeenCalledWith({
      where: { provinceId: 'prov-32' },
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    });
  });

  it('mengembalikan array kosong bila provinceId tidak punya kabupaten/kota (tidak melempar error)', async () => {
    const prisma = createPrismaMock();
    prisma.regency.findMany.mockResolvedValue([]);
    const service = new WilayahService(prisma);

    const result = await service.listRegencies('prov-tidak-ada');

    expect(result).toEqual([]);
  });
});
