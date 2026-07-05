import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { SlugCheckResponseDto } from './dto/slug-check-response.dto';

/** Pola slug valid: huruf kecil, angka, tanda hubung, 3–30 karakter. */
const SLUG_PATTERN = /^[a-z0-9-]{3,30}$/;

/**
 * TenantService — semua query WAJIB difilter tenantId.
 *
 * Pola tenant-scoping (Paket A):
 *   Setiap method menerima `tenantId: string` yang berasal dari
 *   @CurrentTenant() decorator (diisi JwtAuthGuard dari JWT payload).
 *   Query Prisma selalu menyertakan { where: { id: tenantId } } atau
 *   { where: { tenantId } } di tabel yang berelasi.
 *   Jangan pernah query Tenant tanpa filter id/ownerUserId.
 */
@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ambil data tenant milik user yang sedang login. */
  async getMyTenant(tenantId: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        namaBisnis: true,
        kota: true,
        status: true,
        createdAt: true,
        // ownerUserId TIDAK disertakan — tidak bocor ke response
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan.');
    }

    return tenant;
  }

  /** Perbarui data tenant milik user yang sedang login. */
  async updateMyTenant(
    tenantId: string,
    dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    // Pastikan tenant ada dan milik user ini
    await this.getMyTenant(tenantId);

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.namaBisnis !== undefined && { namaBisnis: dto.namaBisnis }),
        ...(dto.kota !== undefined && { kota: dto.kota }),
      },
      select: {
        id: true,
        slug: true,
        namaBisnis: true,
        kota: true,
        status: true,
        createdAt: true,
      },
    });

    return updated;
  }

  /**
   * Cek ketersediaan slug — endpoint publik (GET /tenants/slug-check?slug=xxx).
   * Validasi pola: ^[a-z0-9-]{3,30}$
   * Jika tidak tersedia, beri saran slug-2, slug-3, dst. hingga slot kosong ditemukan.
   */
  async checkSlug(slug: string): Promise<SlugCheckResponseDto> {
    if (!SLUG_PATTERN.test(slug)) {
      // Slug tidak memenuhi format — anggap tidak tersedia tanpa query DB
      return { available: false };
    }

    const existing = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return { available: true };
    }

    // Slug sudah dipakai — cari saran slug-2, slug-3, dst.
    let suggestion: string | undefined;
    for (let i = 2; i <= 10; i++) {
      const candidate = `${slug}-${i}`;
      // Kandidat harus tetap memenuhi pola (maks 30 karakter)
      if (!SLUG_PATTERN.test(candidate)) break;

      const taken = await this.prisma.tenant.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!taken) {
        suggestion = candidate;
        break;
      }
    }

    return { available: false, suggestion };
  }
}
