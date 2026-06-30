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

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Registrasi: buat User + Tenant 1:1 dalam satu transaksi atomik.
   * Paket A — setiap user memiliki tepat satu tenant.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    const slugTaken = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (slugTaken) {
      throw new ConflictException('Slug sudah digunakan, pilih yang lain.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Buat User + Tenant dalam satu transaksi — Paket A 1:1
    const { user, tenant } = await this.prisma.$transaction(async (tx) => {
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

      return { user, tenant };
    });

    const token = this.signToken({ sub: user.id, email: user.email, tenantId: tenant.id });

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
