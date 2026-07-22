import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt');

/**
 * Unit test AuthService — file ini TIDAK ADA sebelum sesi QA milestone
 * wilayah (Province/Regency): `register()` mengimplementasikan F01
 * (onboarding trial — salah satu alur kritis wajib diuji), dan sesi ini
 * menambah cabang logika baru (validasi `regencyId`, 400 bukan 500 FK)
 * tanpa cakupan test sama sekali. Fokus di sini: cabang BARU (regencyId)
 * + guard anti-duplikat existing (email/slug/plan) supaya `register()`
 * punya jaring pengaman minimal.
 *
 * Pola mock sama dengan booking.service.spec.ts/orders.service.spec.ts —
 * Prisma & JwtService di-mock, `$transaction` dieksekusi terhadap `mockTx`.
 * `bcrypt` di-mock (jest.mock) supaya test deterministik & cepat (bukan
 * bcrypt asli 12 rounds).
 */
function createPrismaMock() {
  const mockTx = {
    user: { create: jest.fn() },
    tenant: { create: jest.fn() },
    theme: { create: jest.fn() },
    subscription: { create: jest.fn() },
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    tenant: { findUnique: jest.fn() },
    regency: { findUnique: jest.fn() },
    plan: { findFirst: jest.fn() },
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

function createJwtMock() {
  return { sign: jest.fn().mockReturnValue('mock-jwt-token') };
}

const VALID_REGISTER_DTO: RegisterDto = {
  email: 'baru@contoh.com',
  password: 'password123',
  namaBisnis: 'Sari MUA',
  slug: 'sari-mua',
};

const ACTIVE_PLAN = { id: 'plan-1' };

const CREATED_USER = {
  id: 'user-1',
  email: VALID_REGISTER_DTO.email,
  phone: null,
};

function createdTenant(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'tenant-1',
    slug: VALID_REGISTER_DTO.slug,
    namaBisnis: VALID_REGISTER_DTO.namaBisnis,
    status: 'TRIAL',
    kota: null,
    regencyId: null,
    regency: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
});

describe('AuthService.register', () => {
  it('menolak dengan ConflictException generik bila email sudah terdaftar (anti-enumeration M-1)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.user.findUnique.mockResolvedValue({
      id: 'existing',
      tenant: { id: 'tenant-existing' },
    });
    const service = new AuthService(prisma, createJwtMock() as never);

    await expect(service.register(VALID_REGISTER_DTO)).rejects.toThrow(
      ConflictException,
    );
    expect(rawPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('menolak dengan ConflictException bila slug sudah dipakai', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.user.findUnique.mockResolvedValue(null);
    rawPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-existing' });
    const service = new AuthService(prisma, createJwtMock() as never);

    await expect(service.register(VALID_REGISTER_DTO)).rejects.toThrow(
      ConflictException,
    );
    expect(rawPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('menolak dengan BadRequestException bila regencyId tidak merujuk Regency manapun (bukan 500 FK constraint)', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.user.findUnique.mockResolvedValue(null);
    rawPrisma.tenant.findUnique.mockResolvedValue(null);
    rawPrisma.regency.findUnique.mockResolvedValue(null); // regencyId tidak valid
    const service = new AuthService(prisma, createJwtMock() as never);

    await expect(
      service.register({
        ...VALID_REGISTER_DTO,
        regencyId: 'regency-tidak-ada',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(rawPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('melempar InternalServerErrorException bila tidak ada Plan aktif ter-seed', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.user.findUnique.mockResolvedValue(null);
    rawPrisma.tenant.findUnique.mockResolvedValue(null);
    rawPrisma.plan.findFirst.mockResolvedValue(null);
    const service = new AuthService(prisma, createJwtMock() as never);

    await expect(service.register(VALID_REGISTER_DTO)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('berhasil mendaftar TANPA regencyId (opsional by design) — tenant dibuat dengan regencyId null', async () => {
    const { prisma, rawPrisma, mockTx } = createPrismaMock();
    rawPrisma.user.findUnique.mockResolvedValue(null);
    rawPrisma.tenant.findUnique.mockResolvedValue(null);
    rawPrisma.plan.findFirst.mockResolvedValue(ACTIVE_PLAN);
    mockTx.user.create.mockResolvedValue(CREATED_USER);
    mockTx.tenant.create.mockResolvedValue(createdTenant());

    const jwt = createJwtMock();
    const service = new AuthService(prisma, jwt as never);

    const result = await service.register(VALID_REGISTER_DTO);

    // regencyId tidak divalidasi sama sekali bila tidak dikirim
    expect(rawPrisma.regency.findUnique).not.toHaveBeenCalled();
    expect(mockTx.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ regencyId: undefined }),
      }),
    );
    expect(result.tenant).toMatchObject({ regencyId: null, kota: null });
    expect(result.accessToken).toBe('mock-jwt-token');
    // Theme default & Subscription TRIALING harus tetap dibuat (F01) terlepas dari regencyId
    expect(mockTx.theme.create).toHaveBeenCalled();
    expect(mockTx.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'TRIALING' }),
      }),
    );
  });

  it('berhasil mendaftar DENGAN regencyId valid — tenant.regencyId terisi & kota dari join Regency', async () => {
    const { prisma, rawPrisma, mockTx } = createPrismaMock();
    rawPrisma.user.findUnique.mockResolvedValue(null);
    rawPrisma.tenant.findUnique.mockResolvedValue(null);
    rawPrisma.regency.findUnique.mockResolvedValue({ id: 'reg-1' });
    rawPrisma.plan.findFirst.mockResolvedValue(ACTIVE_PLAN);
    mockTx.user.create.mockResolvedValue(CREATED_USER);
    mockTx.tenant.create.mockResolvedValue(
      createdTenant({
        regencyId: 'reg-1',
        regency: {
          nama: 'Kota Manado',
          provinceId: 'prov-1',
          province: { nama: 'Sulawesi Utara' },
        },
      }),
    );

    const service = new AuthService(prisma, createJwtMock() as never);

    const result = await service.register({
      ...VALID_REGISTER_DTO,
      regencyId: 'reg-1',
    });

    expect(rawPrisma.regency.findUnique).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      select: { id: true },
    });
    expect(result.tenant).toMatchObject({
      regencyId: 'reg-1',
      kota: 'Kota Manado',
      provinceId: 'prov-1',
      provinsi: 'Sulawesi Utara',
    });
  });
});

describe('AuthService.login', () => {
  const LOGIN_DTO: LoginDto = {
    email: VALID_REGISTER_DTO.email,
    password: 'password123',
  };

  it('menolak dengan UnauthorizedException bila password salah', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: LOGIN_DTO.email,
      phone: null,
      passwordHash: 'hashed-password',
      tenant: createdTenant(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const service = new AuthService(prisma, createJwtMock() as never);

    await expect(service.login(LOGIN_DTO)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('berhasil login dan mengembalikan tenant dengan kota ter-mapping', async () => {
    const { prisma, rawPrisma } = createPrismaMock();
    rawPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: LOGIN_DTO.email,
      phone: null,
      passwordHash: 'hashed-password',
      tenant: createdTenant({
        regencyId: 'reg-1',
        regency: {
          nama: 'Kota Manado',
          provinceId: 'prov-1',
          province: { nama: 'Sulawesi Utara' },
        },
      }),
    });
    const service = new AuthService(prisma, createJwtMock() as never);

    const result = await service.login(LOGIN_DTO);

    expect(result.tenant).toMatchObject({ kota: 'Kota Manado' });
  });
});
