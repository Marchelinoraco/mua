import { BadRequestException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import {
  computeDpAmount,
  type DpTipeValue,
} from '../common/pricing/pricing.util';
import {
  parseDateOnlyUtc,
  toDateOnlyString,
  truncateToDateUtc,
} from '../slots/slots.util';

/**
 * Util murni untuk BookingService (F04) — tanpa dependensi Prisma/NestJS DI,
 * supaya mudah diuji unit tanpa mock. REUSE `slots.util` (parseDateOnlyUtc dkk)
 * dan `common/pricing/pricing.util` (computeDpAmount) — jangan tulis ulang.
 */

/**
 * Gabungkan tanggal ("YYYY-MM-DD") + jamMulai (menit sejak 00:00 UTC, dari
 * slot yang dipilih klien via GET /s/:slug/slots) menjadi satu timestamp UTC.
 * Konsisten dengan konvensi "tanggal naive UTC" di slots.util (F05).
 */
export function buildTanggalAcaraUtc(
  tanggalAcaraStr: string,
  jamMulai: number,
): Date {
  const dateOnly = parseDateOnlyUtc(tanggalAcaraStr); // 400 jika format salah
  if (!Number.isInteger(jamMulai) || jamMulai < 0 || jamMulai > 1439) {
    throw new BadRequestException(
      'jamMulai harus berupa menit sejak 00:00 (0-1439).',
    );
  }
  return new Date(dateOnly.getTime() + jamMulai * 60_000);
}

/** Alfabet kode booking — huruf besar + angka (36 kombinasi per karakter). */
const KODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const KODE_SUFFIX_LENGTH = 4;

/** Pola kodeBooking: GB-YYYYMMDD-XXXX (lihat header schema.prisma). */
export const KODE_BOOKING_PATTERN = /^GB-\d{8}-[A-Z0-9]{4}$/;

/**
 * Generate kandidat kodeBooking: `GB-YYYYMMDD-XXXX`.
 * XXXX diambil via `crypto.randomInt` (bukan `Math.random`) — kodeBooking
 * dipakai sebagai "kunci" akses status booking publik (GET /bookings/:kode),
 * jadi sebaiknya tidak mudah ditebak berurutan. Collision di hari+tenant yang
 * sama sangat jarang (36^4 ≈ 1.68 juta kombinasi/hari) tapi tetap ditangani
 * via retry-on-P2002 di BookingService (bukan di sini — fungsi ini murni).
 */
export function generateKodeBooking(tanggalAcara: Date): string {
  const dateOnly = truncateToDateUtc(tanggalAcara);
  const yyyymmdd = toDateOnlyString(dateOnly).replace(/-/g, '');
  let suffix = '';
  for (let i = 0; i < KODE_SUFFIX_LENGTH; i++) {
    suffix += KODE_ALPHABET[randomInt(KODE_ALPHABET.length)];
  }
  return `GB-${yyyymmdd}-${suffix}`;
}

export interface BookingItemPricingInput {
  harga: number;
  dpTipe: DpTipeValue;
  dpNilai: number;
}

/**
 * Hitung totalHarga & dpAmount untuk seluruh booking (FR-F04-2, langkah 7-8
 * brief F04).
 *
 * KEPUTUSAN DESAIN (didokumentasikan untuk frontend-engineer/tech-lead):
 * - `totalHarga` = Σ hargaSnapshot tiap item (qty diasumsikan 1/service di
 *   MVP) + transportFee (dihitung SEKALI untuk seluruh booking, bukan per-item).
 * - `dpAmount` = Σ computeDpAmount(item.harga, item.dpTipe, item.dpNilai) per
 *   item — MENGGUNAKAN dpTipe/dpNilai masing-masing Service (F03: DP diatur
 *   per-layanan, bukan per-tenant), BUKAN dihitung dari totalHarga gabungan.
 * - transportFee TIDAK ikut dikenakan DP (DP hanya atas harga jasa; transport
 *   lazimnya dibayar di lokasi/pelunasan, bukan bagian DP muka). Ini konsisten
 *   dengan Service.dpTipe/dpNilai yang memang scoped ke harga Service saja,
 *   tidak ada field dpTipe di TransportRule.
 */
export function computeBookingTotals(
  items: BookingItemPricingInput[],
  transportFee: number,
): { totalHarga: number; dpAmount: number } {
  const subtotal = items.reduce((sum, item) => sum + item.harga, 0);
  const dpAmount = items.reduce(
    (sum, item) => sum + computeDpAmount(item.harga, item.dpTipe, item.dpNilai),
    0,
  );
  return { totalHarga: subtotal + transportFee, dpAmount };
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  wajib: boolean;
}

export interface CustomValueInput {
  customFieldId: string;
  nilai: string;
}

/**
 * Validasi custom field wajib (FR-F04-4, edge case §9 brief F04) — dipanggil
 * SEBELUM transaksi Prisma dimulai (validasi murni, tidak butuh side-effect).
 * Throw BadRequestException (400) bila:
 * - ada customFieldId di payload yang bukan milik tenant ini, ATAU
 * - ada CustomField wajib=true tanpa nilai (atau nilai kosong/whitespace) di payload.
 */
export function validateWajibCustomFields(
  customFields: CustomFieldDefinition[],
  values: CustomValueInput[] | undefined,
): void {
  const provided = new Map(
    (values ?? []).map((v) => [v.customFieldId, v.nilai]),
  );
  const validIds = new Set(customFields.map((f) => f.id));

  for (const customFieldId of provided.keys()) {
    if (!validIds.has(customFieldId)) {
      throw new BadRequestException(
        'Custom field tidak dikenali untuk tenant ini.',
      );
    }
  }

  for (const field of customFields) {
    if (!field.wajib) continue;
    const nilai = provided.get(field.id);
    if (!nilai || nilai.trim().length === 0) {
      throw new BadRequestException(`${field.label} wajib diisi.`);
    }
  }
}
