import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AVAILABILITY_SELECT } from '../availability/availability.service';
import { PublicSlotsResponseDto } from './dto/public-slots-response.dto';
import { CalendarResponseDto } from './dto/calendar-response.dto';
import {
  addDaysUtc,
  countOccupancy,
  diffDaysUtc,
  generateSlotWindows,
  isBookingActive,
  minutesSinceMidnightUtc,
  parseDateOnlyUtc,
  rangesOverlap,
  toDateOnlyString,
  truncateToDateUtc,
} from './slots.util';

/** Status booking yang dianggap masih "hidup" (belum final negatif) untuk query kandidat. */
const LIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.PAID,
  BookingStatus.AWAITING_DP,
];

/** Rentang maksimum (hari) untuk GET /calendar agar query tidak dieksploitasi. */
const MAX_CALENDAR_RANGE_DAYS = 100;

type BookingOccupancyRow = {
  statusBooking: BookingStatus;
  holdUntil: Date | null;
  tanggalAcara: Date;
  items: { durasi: number }[];
};

/**
 * SlotsService — slot engine F05 (dipakai storefront publik & internal F04 nanti).
 * Semua query WAJIB difilter tenantId (kecuali resolusi tenant dari slug, yang
 * memang publik by design — F05 §7).
 */
@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /s/:slug/slots?date= — PUBLIK tanpa auth.
   * Response minimal: { date, slots } — tidak membocorkan detail booking/klien.
   */
  async getPublicSlotsBySlug(
    slug: string,
    dateStr: string,
  ): Promise<PublicSlotsResponseDto> {
    const date = parseDateOnlyUtc(dateStr);

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan.');
    }

    return this.computeSlotsForDate(tenant.id, date);
  }

  /** Hitung slot tersedia untuk satu tanggal (FR-F05-3). */
  private async computeSlotsForDate(
    tenantId: string,
    date: Date,
  ): Promise<PublicSlotsResponseDto> {
    const hari = date.getUTCDay();

    const [availability, blockedCount, bookings] = await Promise.all([
      this.prisma.availability.findUnique({
        where: { tenantId_hari: { tenantId, hari } },
        select: {
          jamMulai: true,
          jamSelesai: true,
          slotDurasi: true,
          kapasitas: true,
        },
      }),
      this.prisma.blockedDate.count({
        where: {
          tenantId,
          tanggalMulai: { lte: date },
          tanggalSelesai: { gte: date },
        },
      }),
      this.findActiveBookingCandidates(this.prisma, tenantId, date),
    ]);

    const dateOnlyStr = toDateOnlyString(date);

    if (!availability) {
      return { date: dateOnlyStr, slots: [] };
    }

    const now = new Date();
    const activeRanges = bookings
      .filter((booking) => isBookingActive(booking, now))
      .map((booking) => this.toOccupiedRange(booking));

    const isBlocked = blockedCount > 0;
    const windows = generateSlotWindows(availability);

    const slots = windows.map((window) => ({
      jamMulai: window.jamMulai,
      jamSelesai: window.jamSelesai,
      tersedia:
        !isBlocked &&
        countOccupancy(window, activeRanges) < availability.kapasitas,
    }));

    return { date: dateOnlyStr, slots };
  }

  /** GET /calendar?from=&to= — dashboard (auth): booking + blocked dates + availability. */
  async getCalendar(
    tenantId: string,
    fromStr: string,
    toStr: string,
  ): Promise<CalendarResponseDto> {
    const from = parseDateOnlyUtc(fromStr);
    const to = parseDateOnlyUtc(toStr);
    if (from > to) {
      throw new BadRequestException('Parameter from tidak boleh setelah to.');
    }
    const totalDays = diffDaysUtc(from, to) + 1;
    if (totalDays > MAX_CALENDAR_RANGE_DAYS) {
      throw new BadRequestException(
        `Rentang tanggal maksimal ${MAX_CALENDAR_RANGE_DAYS} hari.`,
      );
    }

    const [availability, blockedDates, bookings] = await Promise.all([
      this.prisma.availability.findMany({
        where: { tenantId },
        orderBy: { hari: 'asc' },
        select: AVAILABILITY_SELECT,
      }),
      this.prisma.blockedDate.findMany({
        where: {
          tenantId,
          tanggalMulai: { lte: to },
          tanggalSelesai: { gte: from },
        },
        select: { tanggalMulai: true, tanggalSelesai: true, alasan: true },
      }),
      this.prisma.booking.findMany({
        where: {
          tenantId,
          tanggalAcara: { gte: from, lt: addDaysUtc(to, 1) },
          statusBooking: { not: BookingStatus.CANCELED },
        },
        orderBy: { tanggalAcara: 'asc' },
        select: {
          id: true,
          kodeBooking: true,
          tanggalAcara: true,
          statusBooking: true,
          client: { select: { nama: true } },
          items: { select: { durasi: true } },
        },
      }),
    ]);

    const dayMap = new Map<string, CalendarResponseDto['days'][number]>();
    for (let i = 0; i < totalDays; i++) {
      const d = addDaysUtc(from, i);
      const key = toDateOnlyString(d);
      const blockedEntry = blockedDates.find(
        (b) => d >= b.tanggalMulai && d <= b.tanggalSelesai,
      );
      dayMap.set(key, {
        date: key,
        blocked: !!blockedEntry,
        blockedReason: blockedEntry?.alasan ?? null,
        bookings: [],
      });
    }

    for (const booking of bookings) {
      const key = toDateOnlyString(truncateToDateUtc(booking.tanggalAcara));
      const day = dayMap.get(key);
      if (!day) continue; // di luar rentang (seharusnya tidak terjadi karena query sudah difilter)
      day.bookings.push({
        id: booking.id,
        kodeBooking: booking.kodeBooking,
        tanggalAcara: booking.tanggalAcara,
        statusBooking: booking.statusBooking,
        clientNama: booking.client.nama,
        totalDurasiMenit: booking.items.reduce(
          (sum, item) => sum + item.durasi,
          0,
        ),
      });
    }

    return {
      from: toDateOnlyString(from),
      to: toDateOnlyString(to),
      availability,
      days: Array.from(dayMap.values()),
    };
  }

  /**
   * Primitif anti-bentrok (FR-F05-7) — dipakai F04 saat membuat booking.
   * HARUS dipanggil di dalam prisma.$transaction (parameter `tx` = client transaksi).
   *
   * Kunci atomik: `pg_advisory_xact_lock(hashtext(tenantId:tanggal))`.
   * Dipilih ketimbang `SELECT ... FOR UPDATE` karena baris booking untuk slot
   * ini mungkin BELUM ADA sama sekali (kasus booking pertama di hari itu) —
   * FOR UPDATE tidak bisa mengunci baris yang belum eksis, sehingga dua
   * transaksi paralel yang sama-sama "tidak menemukan baris" bisa lolos
   * bersamaan (race condition tetap terjadi). Advisory lock terskala per
   * tenant+tanggal, sehingga transaksi lain pada tanggal SAMA menunggu giliran,
   * sedangkan tanggal berbeda tidak saling menghambat. Lock otomatis lepas
   * saat transaksi commit/rollback (varian `_xact_`).
   *
   * Setelah lock didapat, method ini RE-CEK okupansi slot (defense-in-depth
   * terhadap request yang lolos validasi awal sebelum lock diperoleh);
   * jika penuh → throw ConflictException("Slot baru saja terisi.").
   */
  async reserveSlotOrThrow(
    tx: Prisma.TransactionClient,
    tenantId: string,
    tanggalAcara: Date,
    durasiMenit: number,
  ): Promise<void> {
    const dateOnly = truncateToDateUtc(tanggalAcara);
    const lockKey = `${tenantId}:${toDateOnlyString(dateOnly)}`;

    // Tagged template Prisma — parameterisasi otomatis, TIDAK ADA interpolasi string.
    // $executeRaw (bukan $queryRaw) karena pg_advisory_xact_lock mengembalikan
    // `void` — $queryRaw gagal mendeserialisasi kolom void, $executeRaw tidak
    // mencoba mendeserialisasi baris hasil sama sekali.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const hari = dateOnly.getUTCDay();
    const availability = await tx.availability.findUnique({
      where: { tenantId_hari: { tenantId, hari } },
      select: { kapasitas: true },
    });
    if (!availability) {
      throw new ConflictException(
        'Belum ada jam kerja yang diatur untuk hari ini.',
      );
    }

    const blockedCount = await tx.blockedDate.count({
      where: {
        tenantId,
        tanggalMulai: { lte: dateOnly },
        tanggalSelesai: { gte: dateOnly },
      },
    });
    if (blockedCount > 0) {
      throw new ConflictException('Tanggal ini diblokir untuk booking.');
    }

    const start = minutesSinceMidnightUtc(tanggalAcara);
    const end = start + durasiMenit;

    const bookings = await this.findActiveBookingCandidates(
      tx,
      tenantId,
      dateOnly,
    );
    const now = new Date();
    const occupancy = bookings
      .filter((booking) => isBookingActive(booking, now))
      .filter((booking) => {
        const range = this.toOccupiedRange(booking);
        return rangesOverlap(start, end, range.start, range.end);
      }).length;

    if (occupancy >= availability.kapasitas) {
      throw new ConflictException('Slot baru saja terisi.');
    }
  }

  /** Query booking kandidat (status hidup) pada satu tanggal kalender — dipakai baca & lock. */
  private findActiveBookingCandidates(
    client: PrismaService | Prisma.TransactionClient,
    tenantId: string,
    dateOnly: Date,
  ): Promise<BookingOccupancyRow[]> {
    return client.booking.findMany({
      where: {
        tenantId,
        tanggalAcara: { gte: dateOnly, lt: addDaysUtc(dateOnly, 1) },
        statusBooking: { in: LIVE_BOOKING_STATUSES },
      },
      select: {
        statusBooking: true,
        holdUntil: true,
        tanggalAcara: true,
        items: { select: { durasi: true } },
      },
    });
  }

  private toOccupiedRange(booking: BookingOccupancyRow): {
    start: number;
    end: number;
  } {
    const start = minutesSinceMidnightUtc(booking.tanggalAcara);
    const totalDurasi = booking.items.reduce(
      (sum, item) => sum + item.durasi,
      0,
    );
    return { start, end: start + totalDurasi };
  }
}
