import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit test TenantService — fokus pada logika BARU milestone wilayah
 * (Province/Regency) yang sebelumnya TIDAK punya cakupan test sama sekali
 * (file ini tidak ada sebelum sesi QA): validasi `regencyId` (400 bila
 * Regency tidak ditemukan — bukan 500 FK constraint) di `updateMyTenant`,
 * dan pemetaan tampilan kota (join Regency/Province, fallback teks lama)
 * lewat `toTenantKotaDisplay` di `getMyTenant`/`updateMyTenant`.
 *
 * Pola mock sama dengan booking.service.spec.ts/orders.service.spec.ts —
 * Prisma di-mock, tidak menyentuh DB nyata.
 */
function createPrismaMock() {
  const prisma = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    regency: {
      findUnique: jest.fn(),
    },
  };
  return {
    prisma: prisma as unknown as PrismaService,
    rawPrisma: prisma,
  };
}

const BASE_TENANT_ROW = {
  id: 'tenant-1',
  slug: 'sari-mua',
  namaBisnis: 'Sari MUA',
  kota: null,
  regencyId: null,
  regency: null,
  status: 'ACTIVE',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('TenantService.getMyTenant', () => {
  it('mengembalikan kota dari join Regency bila regencyId ter-mapping', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.tenant.findUnique.mockResolvedValue({
      ...BASE_TENANT_ROW,
      kota: 'Manado', // teks lama — harus diabaikan karena regency ada
      regencyId: 'reg-1',
      regency: {
        nama: 'Kota Manado',
        provinceId: 'prov-1',
        province: { nama: 'Sulawesi Utara' },
      },
    });
    const service = new TenantService(prisma);

    const result = await service.getMyTenant('tenant-1');

    expect(result).toMatchObject({
      regencyId: 'reg-1',
      kota: 'Kota Manado',
      provinceId: 'prov-1',
      provinsi: 'Sulawesi Utara',
    });
    // ownerUserId TIDAK boleh bocor ke response
    expect(result).not.toHaveProperty('ownerUserId');
  });

  it('fallback ke kota teks bebas lama bila tenant belum ter-mapping ke Regency', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.tenant.findUnique.mockResolvedValue({
      ...BASE_TENANT_ROW,
      kota: 'Jakarta',
      regencyId: null,
      regency: null,
    });
    const service = new TenantService(prisma);

    const result = await service.getMyTenant('tenant-1');

    expect(result).toMatchObject({
      regencyId: null,
      kota: 'Jakarta',
      provinceId: null,
      provinsi: null,
    });
  });

  it('melempar NotFoundException bila tenant tidak ada', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.tenant.findUnique.mockResolvedValue(null);
    const service = new TenantService(prisma);

    await expect(service.getMyTenant('tenant-x')).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('TenantService.updateMyTenant', () => {
  it('menolak regencyId yang tidak ada dengan 400 (bukan 500 FK constraint)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.tenant.findUnique.mockResolvedValue(BASE_TENANT_ROW);
    rawPrisma.regency.findUnique.mockResolvedValue(null); // regencyId tidak valid

    const service = new TenantService(prisma);

    await expect(
      service.updateMyTenant('tenant-1', { regencyId: 'regency-tidak-ada' }),
    ).rejects.toThrow(BadRequestException);

    // Guard harus mencegah update dieksekusi sama sekali
    expect(rawPrisma.tenant.update).not.toHaveBeenCalled();
  });

  it('memperbarui regencyId yang valid tanpa menyentuh Regency lain', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.tenant.findUnique.mockResolvedValue(BASE_TENANT_ROW);
    rawPrisma.regency.findUnique.mockResolvedValue({ id: 'reg-2' });
    rawPrisma.tenant.update.mockResolvedValue({
      ...BASE_TENANT_ROW,
      regencyId: 'reg-2',
      regency: {
        nama: 'Kabupaten Minahasa',
        provinceId: 'prov-1',
        province: { nama: 'Sulawesi Utara' },
      },
    });

    const service = new TenantService(prisma);
    const result = await service.updateMyTenant('tenant-1', {
      regencyId: 'reg-2',
    });

    expect(rawPrisma.regency.findUnique).toHaveBeenCalledWith({
      where: { id: 'reg-2' },
      select: { id: true },
    });
    expect(rawPrisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tenant-1' },
        data: expect.objectContaining({ regencyId: 'reg-2' }),
      }),
    );
    expect(result.kota).toBe('Kabupaten Minahasa');
  });

  it('tidak memvalidasi/menyentuh Regency sama sekali bila regencyId tidak dikirim (hanya ganti namaBisnis)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.tenant.findUnique.mockResolvedValue(BASE_TENANT_ROW);
    rawPrisma.tenant.update.mockResolvedValue({
      ...BASE_TENANT_ROW,
      namaBisnis: 'Sari MUA Baru',
    });

    const service = new TenantService(prisma);
    await service.updateMyTenant('tenant-1', { namaBisnis: 'Sari MUA Baru' });

    expect(rawPrisma.regency.findUnique).not.toHaveBeenCalled();
    expect(rawPrisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { namaBisnis: 'Sari MUA Baru' },
      }),
    );
  });
});

describe('TenantService.checkSlug', () => {
  it('menganggap tidak tersedia tanpa query DB bila format slug invalid', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    const service = new TenantService(prisma);

    const result = await service.checkSlug('a'); // terlalu pendek

    expect(result).toEqual({ available: false });
    expect(rawPrisma.tenant.findUnique).not.toHaveBeenCalled();
  });

  it('mengembalikan available:true bila slug belum dipakai', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.tenant.findUnique.mockResolvedValue(null);
    const service = new TenantService(prisma);

    const result = await service.checkSlug('sari-mua');

    expect(result).toEqual({ available: true });
  });

  it('mengembalikan available:false + saran bila slug sudah dipakai', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.tenant.findUnique
      .mockResolvedValueOnce({ id: 'taken' }) // "sari-mua" sudah dipakai
      .mockResolvedValueOnce(null); // "sari-mua-2" tersedia
    const service = new TenantService(prisma);

    const result = await service.checkSlug('sari-mua');

    expect(result).toEqual({ available: false, suggestion: 'sari-mua-2' });
  });
});
