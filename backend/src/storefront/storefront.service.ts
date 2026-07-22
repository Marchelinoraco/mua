import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toKotaDisplayName } from '../common/wilayah/tenant-kota.util';
import { CreateStorefrontReportDto } from './dto/create-storefront-report.dto';
import {
  StorefrontCustomFieldDto,
  StorefrontProfileResponseDto,
  StorefrontServiceDto,
  StorefrontThemeDto,
  StorefrontTransportDto,
} from './dto/storefront-profile-response.dto';

/** Nilai default Theme (sama dengan default kolom di schema.prisma) — dipakai
 * bila tenant belum pernah menyentuh Theme sama sekali (defensif; F01 harusnya
 * selalu membuat Theme default saat onboarding). */
const DEFAULT_THEME: StorefrontThemeDto = {
  logoUrl: null,
  bannerUrl: null,
  warnaPrimer: '#6C63FF',
  warnaSekunder: '#F3F4F6',
  font: 'Inter',
  template: 'classic',
  customCss: null,
};

const STOREFRONT_TENANT_SELECT = {
  namaBisnis: true,
  kota: true, // fallback teks bebas lama — lihat toKotaDisplayName
  regency: { select: { nama: true } },
  slug: true,
  status: true,
  theme: {
    select: {
      logoUrl: true,
      bannerUrl: true,
      warnaPrimer: true,
      warnaSekunder: true,
      font: true,
      template: true,
      customCss: true,
    },
  },
  services: {
    where: { aktif: true },
    orderBy: { nama: 'asc' },
    select: {
      id: true,
      nama: true,
      deskripsi: true,
      harga: true,
      durasi: true,
      tipe: true,
      dpTipe: true,
      dpNilai: true,
      butuhTransport: true,
    },
  },
  transportRule: {
    select: {
      mode: true,
      flatNominal: true,
      zona: true,
    },
  },
} satisfies Prisma.TenantSelect;

type StorefrontTenantRow = Prisma.TenantGetPayload<{
  select: typeof STOREFRONT_TENANT_SELECT;
}>;

const CUSTOM_FIELD_SELECT = {
  id: true,
  label: true,
  tipe: true,
  opsi: true,
  wajib: true,
  urutan: true,
} satisfies Prisma.CustomFieldSelect;

type StorefrontCustomFieldRow = Prisma.CustomFieldGetPayload<{
  select: typeof CUSTOM_FIELD_SELECT;
}>;

/**
 * StorefrontService — halaman publik per tenant (F02). TANPA AUTH.
 * Resolusi tenant dari slug adalah satu-satunya query lintas-tenant yang sah
 * di sini (by design, sama seperti SlotsService F05). JANGAN PERNAH menambah
 * `select` yang membocorkan ownerUserId/email/data klien/PaymentProfile/
 * detail Subscription.
 */
@Injectable()
export class StorefrontService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /s/:slug — 404 bila slug tak ada atau tenant CANCELED. */
  async getProfile(slug: string): Promise<StorefrontProfileResponseDto> {
    // Query tenant (dengan services/theme/transport ternested) dan custom
    // field dijalankan paralel — customField difilter lewat relasi `tenant.slug`
    // (bukan `tenant.id` yang belum diketahui) supaya benar-benar satu
    // round-trip Promise.all, bukan berurutan.
    const [tenant, customFields] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { slug },
        select: STOREFRONT_TENANT_SELECT,
      }),
      this.prisma.customField.findMany({
        where: { tenant: { slug } },
        orderBy: { urutan: 'asc' },
        select: CUSTOM_FIELD_SELECT,
      }),
    ]);

    if (!tenant || tenant.status === TenantStatus.CANCELED) {
      throw new NotFoundException('Storefront tidak ditemukan.');
    }

    if (tenant.status === TenantStatus.RESTRICTED) {
      // AC-F02-3: halaman nonaktif, bukan error — dan TIDAK ADA field lain
      // yang disertakan (tidak boleh bocor tema/layanan/customField/dsb).
      return { status: 'INACTIVE', namaBisnis: tenant.namaBisnis };
    }

    return {
      status: 'ACTIVE',
      namaBisnis: tenant.namaBisnis,
      kota: toKotaDisplayName(tenant),
      slug: tenant.slug,
      theme: this.toThemeDto(tenant),
      services: tenant.services.map((service) => this.toServiceDto(service)),
      transport: this.toTransportDto(tenant),
      customFields: customFields.map((field) => this.toCustomFieldDto(field)),
    };
  }

  /** POST /s/:slug/report — simpan laporan status OPEN. 404 bila slug tak ada. */
  async createReport(
    slug: string,
    dto: CreateStorefrontReportDto,
  ): Promise<{ ok: true }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) {
      throw new NotFoundException('Storefront tidak ditemukan.');
    }

    await this.prisma.storefrontReport.create({
      data: {
        tenantId: tenant.id,
        alasan: dto.alasan,
        kontak: dto.kontak ?? null,
      },
    });

    // Sengaja TIDAK mengembalikan id/detail — hindari memberi alat enumeration.
    return { ok: true };
  }

  private toThemeDto(tenant: StorefrontTenantRow): StorefrontThemeDto {
    if (!tenant.theme) {
      return DEFAULT_THEME;
    }
    return {
      logoUrl: tenant.theme.logoUrl,
      bannerUrl: tenant.theme.bannerUrl,
      warnaPrimer: tenant.theme.warnaPrimer,
      warnaSekunder: tenant.theme.warnaSekunder,
      font: tenant.theme.font,
      template: tenant.theme.template,
      customCss: tenant.theme.customCss,
    };
  }

  private toServiceDto(
    service: StorefrontTenantRow['services'][number],
  ): StorefrontServiceDto {
    return {
      id: service.id,
      nama: service.nama,
      deskripsi: service.deskripsi,
      harga: Number(service.harga),
      durasi: service.durasi,
      tipe: service.tipe,
      dpTipe: service.dpTipe,
      dpNilai: Number(service.dpNilai),
      butuhTransport: service.butuhTransport,
    };
  }

  private toTransportDto(
    tenant: StorefrontTenantRow,
  ): StorefrontTransportDto | null {
    if (!tenant.transportRule) {
      return null;
    }
    return {
      mode: tenant.transportRule.mode,
      flatNominal:
        tenant.transportRule.flatNominal === null
          ? null
          : Number(tenant.transportRule.flatNominal),
      zona:
        (tenant.transportRule.zona as
          | {
              nama: string;
              nominal: number;
            }[]
          | null) ?? null,
    };
  }

  private toCustomFieldDto(
    field: StorefrontCustomFieldRow,
  ): StorefrontCustomFieldDto {
    return {
      id: field.id,
      label: field.label,
      tipe: field.tipe,
      opsi: (field.opsi as string[] | null) ?? null,
      wajib: field.wajib,
      urutan: field.urutan,
    };
  }
}
