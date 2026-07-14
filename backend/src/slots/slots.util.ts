import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

/** Pola tanggal-saja yang diterima di query string (mis. ?date=2026-07-14). */
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse "YYYY-MM-DD" menjadi Date pada tengah malam UTC.
 *
 * Keputusan desain (F05): tenant belum punya kolom zona waktu (hanya
 * `User.timezone` opsional, bukan per-tenant). Untuk MVP, tanggal kalender
 * diperlakukan sebagai tanggal "naive" — diparse & dibandingkan selalu di
 * UTC (bukan waktu lokal server) — supaya hari-dalam-minggu dan perhitungan
 * slot konsisten di lingkungan mana pun proses Node berjalan (Vercel bisa
 * berbeda region dari Neon). Dukungan WIB/WITA/WIT eksplisit per tenant
 * adalah item lanjutan (lihat F05 §9 edge case zona waktu).
 */
export function parseDateOnlyUtc(dateStr: string): Date {
  if (!DATE_ONLY_PATTERN.test(dateStr)) {
    throw new BadRequestException('Format tanggal harus YYYY-MM-DD.');
  }
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Format tanggal harus YYYY-MM-DD.');
  }
  return date;
}

/** Format Date (asumsi sudah tengah malam UTC) balik ke "YYYY-MM-DD". */
export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Tambah `days` hari kalender (UTC) ke sebuah Date. */
export function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Potong komponen jam/menit — kembalikan tengah malam UTC dari tanggal yang sama. */
export function truncateToDateUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Selisih hari kalender (UTC) antara dua Date tengah-malam. */
export function diffDaysUtc(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

/** Menit sejak tengah malam (UTC) dari komponen jam:menit sebuah Date. */
export function minutesSinceMidnightUtc(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export interface SlotWindow {
  jamMulai: number;
  jamSelesai: number;
}

/**
 * FR-F05-3: generate daftar slot dari jamMulai s/d jamSelesai, melangkah per
 * slotDurasi. Slot terakhir yang tidak muat penuh (sisa < slotDurasi) dibuang.
 */
export function generateSlotWindows(availability: {
  jamMulai: number;
  jamSelesai: number;
  slotDurasi: number;
}): SlotWindow[] {
  const { jamMulai, jamSelesai, slotDurasi } = availability;
  const windows: SlotWindow[] = [];
  if (slotDurasi <= 0) return windows;
  for (
    let start = jamMulai;
    start + slotDurasi <= jamSelesai;
    start += slotDurasi
  ) {
    windows.push({ jamMulai: start, jamSelesai: start + slotDurasi });
  }
  return windows;
}

/** Dua rentang menit [aStart,aEnd) dan [bStart,bEnd) beririsan? */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * FR-F05-3 / AC-F05-2: booking dianggap "aktif" (memblokir slot) bila:
 * - statusBooking CONFIRMED atau PAID (kunci permanen), ATAU
 * - statusBooking AWAITING_DP dengan holdUntil > now (hold masih berlaku).
 *
 * Lazy expiry: booking AWAITING_DP yang holdUntil sudah lewat dianggap BEBAS
 * di sini tanpa perlu mengubah statusBooking di DB — flip status ke EXPIRED
 * dilakukan oleh worker/cron terpisah (F05 FR-F05-5, direncanakan F08).
 * Ini murni bacaan (read-time filter), aman dipanggil berkali-kali.
 */
export function isBookingActive(
  booking: { statusBooking: BookingStatus; holdUntil: Date | null },
  now: Date,
): boolean {
  if (
    booking.statusBooking === BookingStatus.CONFIRMED ||
    booking.statusBooking === BookingStatus.PAID
  ) {
    return true;
  }
  if (booking.statusBooking === BookingStatus.AWAITING_DP) {
    return booking.holdUntil !== null && booking.holdUntil > now;
  }
  return false;
}

export interface OccupiedRange {
  start: number;
  end: number;
}

/** Hitung berapa banyak rentang booking aktif yang beririsan dengan sebuah slot. */
export function countOccupancy(
  slot: SlotWindow,
  activeRanges: OccupiedRange[],
): number {
  return activeRanges.filter((range) =>
    rangesOverlap(slot.jamMulai, slot.jamSelesai, range.start, range.end),
  ).length;
}
