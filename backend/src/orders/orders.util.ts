import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

/**
 * Util murni untuk OrdersService/ClientsService (F09) — parsing & validasi
 * query string bersama (pagination, filter status multi-value).
 */

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Parse & validasi `?page=&limit=` (dipakai GET /orders & GET /clients).
 * Default page=1, limit=20; limit dibatasi maksimal MAX_LIMIT (400 bila
 * dilanggar, bukan silent-clamp — konsisten dengan validasi ketat lain di
 * codebase, mis. MAX_CALENDAR_RANGE_DAYS di SlotsService).
 */
export function parsePagination(
  pageStr?: string,
  limitStr?: string,
): PaginationParams {
  const page = parsePositiveIntOr(pageStr, DEFAULT_PAGE, 'page');
  const limit = parsePositiveIntOr(limitStr, DEFAULT_LIMIT, 'limit');
  if (limit > MAX_LIMIT) {
    throw new BadRequestException(`Parameter limit maksimal ${MAX_LIMIT}.`);
  }
  return { page, limit, skip: (page - 1) * limit };
}

function parsePositiveIntOr(
  value: string | undefined,
  fallback: number,
  label: string,
): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new BadRequestException(
      `Parameter ${label} harus bilangan bulat positif.`,
    );
  }
  return n;
}

/**
 * Parse `?status=CONFIRMED,PAID` (multi-value via comma) menjadi
 * BookingStatus[]; validasi tiap token terhadap enum. undefined bila
 * parameter tidak dikirim (tanpa filter status).
 */
export function parseStatusFilter(raw?: string): BookingStatus[] | undefined {
  if (!raw) return undefined;
  const tokens = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (tokens.length === 0) return undefined;

  const validValues = new Set<string>(Object.values(BookingStatus));
  for (const token of tokens) {
    if (!validValues.has(token)) {
      throw new BadRequestException(`Status booking tidak valid: ${token}.`);
    }
  }
  return tokens as BookingStatus[];
}
