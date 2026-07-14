import { BookingStatus } from '@prisma/client';
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

describe('parseDateOnlyUtc', () => {
  it('parse "YYYY-MM-DD" menjadi tengah malam UTC', () => {
    const date = parseDateOnlyUtc('2026-07-14');
    expect(date.getUTCFullYear()).toBe(2026);
    expect(date.getUTCMonth()).toBe(6); // 0-indexed
    expect(date.getUTCDate()).toBe(14);
    expect(date.getUTCHours()).toBe(0);
  });

  it('menolak format selain YYYY-MM-DD', () => {
    expect(() => parseDateOnlyUtc('14-07-2026')).toThrow();
    expect(() => parseDateOnlyUtc('2026/07/14')).toThrow();
    expect(() => parseDateOnlyUtc('not-a-date')).toThrow();
  });
});

describe('toDateOnlyString / addDaysUtc / diffDaysUtc / truncateToDateUtc', () => {
  it('round-trip parse -> format', () => {
    expect(toDateOnlyString(parseDateOnlyUtc('2026-07-14'))).toBe('2026-07-14');
  });

  it('addDaysUtc menambah hari kalender dengan benar (lintas bulan)', () => {
    const date = parseDateOnlyUtc('2026-07-31');
    expect(toDateOnlyString(addDaysUtc(date, 1))).toBe('2026-08-01');
  });

  it('diffDaysUtc menghitung selisih hari', () => {
    const from = parseDateOnlyUtc('2026-07-01');
    const to = parseDateOnlyUtc('2026-07-10');
    expect(diffDaysUtc(from, to)).toBe(9);
  });

  it('truncateToDateUtc membuang komponen jam', () => {
    const withTime = new Date('2026-07-14T15:30:00.000Z');
    const truncated = truncateToDateUtc(withTime);
    expect(toDateOnlyString(truncated)).toBe('2026-07-14');
    expect(truncated.getUTCHours()).toBe(0);
  });
});

describe('generateSlotWindows (FR-F05-3)', () => {
  it('generate slot berjarak slotDurasi dari jamMulai s/d jamSelesai', () => {
    const windows = generateSlotWindows({
      jamMulai: 540, // 09:00
      jamSelesai: 720, // 12:00
      slotDurasi: 60,
    });
    expect(windows).toEqual([
      { jamMulai: 540, jamSelesai: 600 },
      { jamMulai: 600, jamSelesai: 660 },
      { jamMulai: 660, jamSelesai: 720 },
    ]);
  });

  it('membuang sisa slot yang tidak muat penuh', () => {
    const windows = generateSlotWindows({
      jamMulai: 540,
      jamSelesai: 700, // sisa 160 menit, slot 60 menit -> 2 slot penuh, sisa 40 dibuang
      slotDurasi: 60,
    });
    expect(windows).toHaveLength(2);
  });

  it('mengembalikan array kosong jika slotDurasi tidak valid', () => {
    expect(
      generateSlotWindows({ jamMulai: 0, jamSelesai: 100, slotDurasi: 0 }),
    ).toEqual([]);
  });
});

describe('rangesOverlap', () => {
  it('mendeteksi irisan waktu', () => {
    expect(rangesOverlap(540, 600, 570, 630)).toBe(true);
    expect(rangesOverlap(540, 600, 600, 660)).toBe(false); // bersebelahan, tidak overlap
    expect(rangesOverlap(540, 600, 500, 540)).toBe(false);
    expect(rangesOverlap(540, 720, 600, 660)).toBe(true); // fully contained
  });
});

describe('isBookingActive (AC-F05-2, lazy expiry)', () => {
  const now = new Date('2026-07-14T10:00:00.000Z');

  it('CONFIRMED selalu aktif (kunci permanen)', () => {
    expect(
      isBookingActive(
        { statusBooking: BookingStatus.CONFIRMED, holdUntil: null },
        now,
      ),
    ).toBe(true);
  });

  it('PAID selalu aktif', () => {
    expect(
      isBookingActive(
        { statusBooking: BookingStatus.PAID, holdUntil: null },
        now,
      ),
    ).toBe(true);
  });

  it('AWAITING_DP dengan holdUntil di masa depan dianggap aktif', () => {
    const holdUntil = new Date('2026-07-14T11:00:00.000Z');
    expect(
      isBookingActive(
        { statusBooking: BookingStatus.AWAITING_DP, holdUntil },
        now,
      ),
    ).toBe(true);
  });

  it('AWAITING_DP dengan holdUntil sudah lewat dianggap BEBAS (lazy expiry)', () => {
    const holdUntil = new Date('2026-07-14T09:00:00.000Z'); // sudah lewat
    expect(
      isBookingActive(
        { statusBooking: BookingStatus.AWAITING_DP, holdUntil },
        now,
      ),
    ).toBe(false);
  });

  it('AWAITING_DP tanpa holdUntil (null) dianggap tidak aktif', () => {
    expect(
      isBookingActive(
        { statusBooking: BookingStatus.AWAITING_DP, holdUntil: null },
        now,
      ),
    ).toBe(false);
  });

  it('EXPIRED/CANCELED/COMPLETED tidak pernah aktif', () => {
    for (const status of [
      BookingStatus.EXPIRED,
      BookingStatus.CANCELED,
      BookingStatus.COMPLETED,
    ]) {
      expect(
        isBookingActive({ statusBooking: status, holdUntil: null }, now),
      ).toBe(false);
    }
  });
});

describe('countOccupancy + minutesSinceMidnightUtc (perhitungan slot end-to-end)', () => {
  it('menghitung okupansi slot berdasarkan rentang booking aktif yang beririsan', () => {
    const slot = { jamMulai: 540, jamSelesai: 600 }; // 09:00-10:00
    const activeRanges = [
      { start: 570, end: 630 }, // 09:30-10:30 -> overlap
      { start: 480, end: 540 }, // 08:00-09:00 -> tidak overlap (bersebelahan)
      { start: 600, end: 660 }, // 10:00-11:00 -> tidak overlap (bersebelahan)
    ];
    expect(countOccupancy(slot, activeRanges)).toBe(1);
  });

  it('minutesSinceMidnightUtc mengekstrak menit sejak tengah malam UTC', () => {
    const date = new Date('2026-07-14T09:30:00.000Z');
    expect(minutesSinceMidnightUtc(date)).toBe(9 * 60 + 30);
  });
});

describe('Blocked date overlap (F05 §9)', () => {
  it('tanggal dalam rentang blocked dianggap blocked', () => {
    const blockedStart = parseDateOnlyUtc('2026-07-10');
    const blockedEnd = parseDateOnlyUtc('2026-07-15');
    const check = (d: string) => {
      const date = parseDateOnlyUtc(d);
      return date >= blockedStart && date <= blockedEnd;
    };
    expect(check('2026-07-10')).toBe(true); // batas awal inklusif
    expect(check('2026-07-15')).toBe(true); // batas akhir inklusif
    expect(check('2026-07-12')).toBe(true); // di tengah
    expect(check('2026-07-09')).toBe(false);
    expect(check('2026-07-16')).toBe(false);
  });
});
