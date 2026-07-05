import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { MeResponseDto } from './dto/me-response.dto';

const BCRYPT_ROUNDS = 12;

/** Warna & konfigurasi Theme default untuk setiap tenant baru. */
const DEFAULT_THEME = {
  warnaPrimer: '#E91E8C',
  warnaSekunder: '#F8BBD9',
  font: 'inter',
  template: 'classic',
} as const;

/** Durasi trial dalam milidetik (14 hari). */
const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Registrasi: buat User + Tenant + Theme + Subscription dalam satu transaksi atomik.
   * Paket A — setiap user memiliki tepat satu tenant.
   * Guard anti-duplikat: cek User.email & Tenant.ownerUserId sebelum membuat.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // --- Pre-transaction checks ---
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, tenant: { select: { id: true } } },
    });
    if (existing) {
      // Guard anti-duplikat tenant (FR-F01-7 / FR-F01-8)
      if (existing.tenant) {
        throw new ConflictException('Akun ini sudah memiliki tenant.');
      }
      throw new ConflictException('Email sudah terdaftar.');
    }

    const slugTaken = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (slugTaken) {
      throw new ConflictException('Slug sudah digunakan, pilih yang lain.');
    }

    // Query Plan pertama (tierUrutan=1) di luar transaksi — data global, bukan tenant-scoped
    const firstPlan = await this.prisma.plan.findFirst({
      where: { aktif: true },
      orderBy: { tierUrutan: 'asc' },
      select: { id: true },
    });

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DURATION_MS);

    // Buat User + Tenant + Theme + Subscription dalam satu transaksi atomik
    const { user, tenant } = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            phone: dto.phone,
            passwordHash,
          },
        });

        const tenant = await tx.tenant.create({
          data: {
            ownerUserId: user.id,
            slug: dto.slug,
            namaBisnis: dto.namaBisnis,
            kota: dto.kota,
            // status default = TRIAL (sesuai skema)
          },
        });

        // Theme default per tenant (F01 / F02)
        await tx.theme.create({
          data: {
            tenantId: tenant.id,
            warnaPrimer: DEFAULT_THEME.warnaPrimer,
            warnaSekunder: DEFAULT_THEME.warnaSekunder,
            font: DEFAULT_THEME.font,
            template: DEFAULT_THEME.template,
          },
        });

        // Subscription TRIALING 14 hari (F07)
        // planId = Plan dengan tierUrutan terendah aktif; null (via as any) jika DB
        // belum diisi Plan — acceptable untuk fase dev awal sebelum seed Plan.
        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: firstPlan?.id ?? null,
            status: 'TRIALING',
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
            ordersUsedPeriod: 0,
          } as any, // planId nullable sementara — skema akan diperketat saat Plan di-seed
        });

        return { user, tenant };
      },
    );

    const token = this.signToken({
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
    });

    return {
      accessToken: token,
      user: { id: user.id, email: user.email, phone: user.phone },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        namaBisnis: tenant.namaBisnis,
        kota: tenant.kota,
        status: tenant.status,
      },
    };
  }

  /**
   * GET /auth/me — kembalikan profil user + tenant + subscription aktif.
   * Endpoint terproteksi JwtAuthGuard.
   * Query user & tenant secara terpisah — relasi 1:1 singular tidak mendukung
   * filter `where` di dalam `select` Prisma.
   */
  async getMe(userId: string, tenantId: string): Promise<MeResponseDto> {
    // Query user dan tenant secara paralel — tidak ada dependensi satu sama lain
    const [user, tenant] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          timezone: true,
        },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          slug: true,
          namaBisnis: true,
          kota: true,
          status: true,
          subscription: {
            select: {
              status: true,
              currentPeriodEnd: true,
              ordersUsedPeriod: true,
            },
          },
        },
      }),
    ]);

    if (!user || !tenant) {
      throw new UnauthorizedException('Sesi tidak valid.');
    }

    const subscription = tenant.subscription;

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone ?? null,
        timezone: user.timezone ?? null,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        namaBisnis: tenant.namaBisnis,
        kota: tenant.kota ?? null,
        status: tenant.status,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            ordersUsedPeriod: subscription.ordersUsedPeriod,
          }
        : null,
    };
  }

  /**
   * Login: verifikasi kredensial, kembalikan JWT dengan tenantId.
   * OTP — di-stub untuk saat ini (TODO Fase 1).
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        phone: true,
        passwordHash: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            namaBisnis: true,
            kota: true,
            status: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    if (!user.tenant) {
      // Seharusnya tidak terjadi pada Paket A — user selalu punya tenant
      throw new UnauthorizedException('Tenant tidak ditemukan. Hubungi dukungan.');
    }

    const token = this.signToken({
      sub: user.id,
      email: user.email,
      tenantId: user.tenant.id,
    });

    return {
      accessToken: token,
      user: { id: user.id, email: user.email, phone: user.phone },
      tenant: user.tenant,
    };
  }

  private signToken(payload: JwtPayload): string {
    return this.jwt.sign(payload);
  }
}
