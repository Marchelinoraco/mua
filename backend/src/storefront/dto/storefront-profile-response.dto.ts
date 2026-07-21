import { DpTipe, ServiceType, TransportMode } from '@prisma/client';

/**
 * Response GET /s/:slug — profil storefront publik (F02).
 * JANGAN PERNAH tambahkan field: ownerUserId, email, data klien/booking,
 * PaymentProfile, atau detail status Subscription — storefront ini
 * diakses TANPA auth oleh siapa pun.
 */
export class StorefrontThemeDto {
  logoUrl: string | null;
  bannerUrl: string | null;
  warnaPrimer: string;
  warnaSekunder: string;
  font: string;
  template: string;
  customCss: string | null;
}

export class StorefrontServiceDto {
  id: string;
  nama: string;
  deskripsi: string | null;
  harga: number;
  durasi: number;
  tipe: ServiceType;
  dpTipe: DpTipe;
  dpNilai: number;
  butuhTransport: boolean;
}

export class StorefrontTransportDto {
  mode: TransportMode;
  flatNominal: number | null;
  zona: { nama: string; nominal: number }[] | null;
}

/**
 * Metadata custom field tenant (F03) — dipakai FE untuk me-render form booking
 * dinamis (F04). Nilai isian klien TIDAK ada di sini (itu urusan booking).
 */
export class StorefrontCustomFieldDto {
  id: string;
  label: string;
  tipe: string; // "text" | "select" | "checkbox" | "date" | "file"
  opsi: string[] | null;
  wajib: boolean;
  urutan: number;
}

/**
 * status "INACTIVE" (tenant RESTRICTED, AC-F02-3): HANYA status+namaBisnis,
 * field lain sengaja tidak dikirim (tidak `undefined` di objek, tidak ada
 * di JSON sama sekali) supaya tidak ada indikasi data lain bocor.
 */
export type StorefrontProfileResponseDto =
  | { status: 'INACTIVE'; namaBisnis: string }
  | {
      status: 'ACTIVE';
      namaBisnis: string;
      kota: string | null;
      slug: string;
      theme: StorefrontThemeDto;
      services: StorefrontServiceDto[];
      transport: StorefrontTransportDto | null;
      customFields: StorefrontCustomFieldDto[];
    };
