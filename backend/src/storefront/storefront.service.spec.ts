import { NotFoundException } from '@nestjs/common';
import {
  DpTipe,
  ServiceType,
  TenantStatus,
  TransportMode,
} from '@prisma/client';
import { StorefrontService } from './storefront.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit test StorefrontService (F02) — Prisma di-mock (pola sama dengan
 * `blocked-dates/blocked-dates.service.spec.ts`): logika di sini murni
 * "baca tenant by slug lalu map response", tidak ada primitif DB yang tidak
 * bisa dimock.
 */
function createPrismaMock() {
  return {
    tenant: {
      findUnique: jest.fn(),
    },
    customField: {
      // Default [] — kebanyakan test tidak peduli custom field; test yang
      // peduli meng-override resolved value ini secara eksplisit.
      findMany: jest.fn().mockResolvedValue([]),
    },
    storefrontReport: {
      create: jest.fn(),
    },
  } as unknown as PrismaService & {
    tenant: { findUnique: jest.Mock };
    customField: { findMany: jest.Mock };
    storefrontReport: { create: jest.Mock };
  };
}

const BASE_TENANT = {
  namaBisnis: 'Sari MUA',
  kota: 'Manado',
  slug: 'sari-mua',
  status: TenantStatus.ACTIVE,
  theme: {
    logoUrl: 'https://cdn/logo.png',
    bannerUrl: null,
    warnaPrimer: '#111111',
    warnaSekunder: '#222222',
    font: 'Poppins',
    template: 'elegant',
    customCss: '.a{color:red}',
  },
  services: [
    {
      id: 'svc-1',
      nama: 'Riasan Pengantin',
      deskripsi: null,
      harga: 1_000_000 as unknown as import('@prisma/client').Prisma.Decimal,
      durasi: 120,
      tipe: ServiceType.MAKEUP,
      dpTipe: DpTipe.PERSEN,
      dpNilai: 30 as unknown as import('@prisma/client').Prisma.Decimal,
      butuhTransport: true,
    },
  ],
  transportRule: {
    mode: TransportMode.FLAT,
    flatNominal: 100_000 as unknown as import('@prisma/client').Prisma.Decimal,
    zona: null,
  },
};

describe('StorefrontService.getProfile (F02)', () => {
  it('mengembalikan 404 bila slug tidak ditemukan', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue(null);
    const service = new StorefrontService(prisma);

    await expect(service.getProfile('tidak-ada')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('mengembalikan 404 bila tenant CANCELED', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue({
      ...BASE_TENANT,
      status: TenantStatus.CANCELED,
    });
    const service = new StorefrontService(prisma);

    await expect(service.getProfile('sari-mua')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('mengembalikan bentuk INACTIVE minimal bila tenant RESTRICTED (AC-F02-3) — tanpa bocor field lain', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue({
      ...BASE_TENANT,
      status: TenantStatus.RESTRICTED,
    });
    const service = new StorefrontService(prisma);

    const result = await service.getProfile('sari-mua');

    expect(result).toEqual({
      status: 'INACTIVE',
      namaBisnis: 'Sari MUA',
    });
    // Pastikan tidak ada field lain (theme/services/transport/slug/kota) yang bocor.
    expect(Object.keys(result)).toEqual(['status', 'namaBisnis']);
  });

  it('mengembalikan profil ACTIVE lengkap dan HANYA service aktif=true yang keluar', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue(BASE_TENANT);
    const service = new StorefrontService(prisma);

    const result = await service.getProfile('sari-mua');

    expect(result).toMatchObject({
      status: 'ACTIVE',
      namaBisnis: 'Sari MUA',
      kota: 'Manado',
      slug: 'sari-mua',
      theme: {
        logoUrl: 'https://cdn/logo.png',
        warnaPrimer: '#111111',
        customCss: '.a{color:red}',
      },
      transport: { mode: TransportMode.FLAT, flatNominal: 100_000 },
    });
    expect(result.status === 'ACTIVE' && result.services).toEqual([
      {
        id: 'svc-1',
        nama: 'Riasan Pengantin',
        deskripsi: null,
        harga: 1_000_000,
        durasi: 120,
        tipe: ServiceType.MAKEUP,
        dpTipe: DpTipe.PERSEN,
        dpNilai: 30,
        butuhTransport: true,
      },
    ]);

    // Query WAJIB memfilter service aktif=true (service non-aktif tidak boleh
    // pernah keluar dari DB untuk halaman ini).
    expect(prisma.tenant.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'sari-mua' },
        select: expect.objectContaining({
          services: expect.objectContaining({
            where: { aktif: true },
          }),
        }),
      }),
    );
  });

  it('tidak membocorkan field sensitif (ownerUserId/email/subscription) pada select Prisma', () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue(BASE_TENANT);
    void new StorefrontService(prisma).getProfile('sari-mua');

    const selectArg = prisma.tenant.findUnique.mock.calls[0][0].select;
    expect(selectArg).not.toHaveProperty('ownerUserId');
    expect(selectArg).not.toHaveProperty('owner');
    expect(selectArg).not.toHaveProperty('subscription');
    expect(selectArg).not.toHaveProperty('paymentProfile');
    expect(selectArg).not.toHaveProperty('clients');
    expect(selectArg).not.toHaveProperty('bookings');
  });

  it('transport null bila tenant belum mengatur TransportRule', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue({
      ...BASE_TENANT,
      transportRule: null,
    });
    const service = new StorefrontService(prisma);

    const result = await service.getProfile('sari-mua');

    expect(result.status === 'ACTIVE' && result.transport).toBeNull();
  });

  it('mengembalikan customFields (ACTIVE) terurut sesuai urutan (F03 → F04)', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue(BASE_TENANT);
    prisma.customField.findMany.mockResolvedValue([
      {
        id: 'cf-1',
        label: 'Adat Pernikahan',
        tipe: 'select',
        opsi: ['Jawa', 'Sunda', 'Batak'],
        wajib: true,
        urutan: 0,
      },
      {
        id: 'cf-2',
        label: 'Catatan Tambahan',
        tipe: 'text',
        opsi: null,
        wajib: false,
        urutan: 1,
      },
    ]);
    const service = new StorefrontService(prisma);

    const result = await service.getProfile('sari-mua');

    expect(result.status === 'ACTIVE' && result.customFields).toEqual([
      {
        id: 'cf-1',
        label: 'Adat Pernikahan',
        tipe: 'select',
        opsi: ['Jawa', 'Sunda', 'Batak'],
        wajib: true,
        urutan: 0,
      },
      {
        id: 'cf-2',
        label: 'Catatan Tambahan',
        tipe: 'text',
        opsi: null,
        wajib: false,
        urutan: 1,
      },
    ]);
    // Urutan pengambilan WAJIB dari DB (orderBy urutan asc), bukan disortir
    // ulang di aplikasi.
    expect(prisma.customField.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { urutan: 'asc' } }),
    );
  });

  it('response INACTIVE (tenant RESTRICTED) TIDAK memiliki key customFields sama sekali', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue({
      ...BASE_TENANT,
      status: TenantStatus.RESTRICTED,
    });
    prisma.customField.findMany.mockResolvedValue([
      {
        id: 'cf-1',
        label: 'Adat Pernikahan',
        tipe: 'select',
        opsi: ['Jawa'],
        wajib: true,
        urutan: 0,
      },
    ]);
    const service = new StorefrontService(prisma);

    const result = await service.getProfile('sari-mua');

    expect(result).toEqual({ status: 'INACTIVE', namaBisnis: 'Sari MUA' });
    expect(Object.keys(result)).not.toContain('customFields');
  });
});

describe('StorefrontService.createReport (F02, FR-F02-5)', () => {
  it('menyimpan StorefrontReport status OPEN (default) dan mengembalikan { ok: true } tanpa detail', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    prisma.storefrontReport.create.mockResolvedValue({ id: 'report-1' });
    const service = new StorefrontService(prisma);

    const result = await service.createReport('sari-mua', {
      alasan: 'Konten tidak pantas dan menyesatkan klien.',
      kontak: '0812xxxx',
    });

    expect(result).toEqual({ ok: true });
    expect(prisma.storefrontReport.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        alasan: 'Konten tidak pantas dan menyesatkan klien.',
        kontak: '0812xxxx',
      },
    });
  });

  it('kontak opsional → disimpan null bila tidak diisi', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
    prisma.storefrontReport.create.mockResolvedValue({ id: 'report-2' });
    const service = new StorefrontService(prisma);

    await service.createReport('sari-mua', {
      alasan: 'Alasan tanpa kontak yang cukup panjang.',
    });

    expect(prisma.storefrontReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ kontak: null }),
      }),
    );
  });

  it('404 bila slug tidak ditemukan — tidak sampai membuat report', async () => {
    const prisma = createPrismaMock();
    prisma.tenant.findUnique.mockResolvedValue(null);
    const service = new StorefrontService(prisma);

    await expect(
      service.createReport('tidak-ada', {
        alasan: 'Alasan valid minimal 10 karakter.',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.storefrontReport.create).not.toHaveBeenCalled();
  });
});
