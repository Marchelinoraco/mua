import { BadRequestException } from '@nestjs/common';
import {
  KODE_BOOKING_PATTERN,
  buildTanggalAcaraUtc,
  computeBookingTotals,
  generateKodeBooking,
  validateWajibCustomFields,
} from './booking.util';

describe('buildTanggalAcaraUtc', () => {
  it('menggabungkan tanggal + jamMulai (menit) menjadi timestamp UTC', () => {
    const dt = buildTanggalAcaraUtc('2026-08-01', 570); // 09:30
    expect(dt.toISOString()).toBe('2026-08-01T09:30:00.000Z');
  });

  it('jamMulai 0 -> tengah malam', () => {
    const dt = buildTanggalAcaraUtc('2026-08-01', 0);
    expect(dt.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  it('menolak format tanggal salah', () => {
    expect(() => buildTanggalAcaraUtc('01-08-2026', 570)).toThrow(
      BadRequestException,
    );
  });

  it('menolak jamMulai di luar rentang 0-1439', () => {
    expect(() => buildTanggalAcaraUtc('2026-08-01', -1)).toThrow(
      BadRequestException,
    );
    expect(() => buildTanggalAcaraUtc('2026-08-01', 1440)).toThrow(
      BadRequestException,
    );
  });

  it('menolak jamMulai non-integer', () => {
    expect(() => buildTanggalAcaraUtc('2026-08-01', 12.5)).toThrow(
      BadRequestException,
    );
  });
});

describe('generateKodeBooking', () => {
  it('format GB-YYYYMMDD-XXXX', () => {
    const kode = generateKodeBooking(new Date('2026-08-01T09:30:00.000Z'));
    expect(kode).toMatch(KODE_BOOKING_PATTERN);
    expect(kode.startsWith('GB-20260801-')).toBe(true);
  });

  it('menghasilkan kode berbeda pada pemanggilan berulang (acak)', () => {
    const kodes = new Set(
      Array.from({ length: 20 }, () =>
        generateKodeBooking(new Date('2026-08-01T09:30:00.000Z')),
      ),
    );
    // Sangat kecil kemungkinan 20 percobaan semuanya sama persis.
    expect(kodes.size).toBeGreaterThan(1);
  });
});

describe('computeBookingTotals (keputusan desain DP per-service + transport sekali)', () => {
  it('menjumlahkan hargaSnapshot + transportFee untuk totalHarga', () => {
    const { totalHarga } = computeBookingTotals(
      [
        { harga: 1_000_000, dpTipe: 'PERSEN', dpNilai: 30 },
        { harga: 500_000, dpTipe: 'NOMINAL', dpNilai: 100_000 },
      ],
      150_000, // transport fee, dikenakan sekali
    );
    expect(totalHarga).toBe(1_000_000 + 500_000 + 150_000);
  });

  it('menjumlahkan DP per-item sesuai dpTipe/dpNilai masing-masing Service', () => {
    const { dpAmount } = computeBookingTotals(
      [
        { harga: 1_000_000, dpTipe: 'PERSEN', dpNilai: 30 }, // 300_000
        { harga: 500_000, dpTipe: 'NOMINAL', dpNilai: 100_000 }, // 100_000 (clamp tidak kena)
      ],
      150_000,
    );
    expect(dpAmount).toBe(300_000 + 100_000);
  });

  it('transportFee TIDAK dikenakan DP (hanya menambah totalHarga)', () => {
    const { totalHarga, dpAmount } = computeBookingTotals(
      [{ harga: 1_000_000, dpTipe: 'PERSEN', dpNilai: 30 }],
      1_000_000, // transport fee sengaja besar
    );
    expect(totalHarga).toBe(2_000_000);
    expect(dpAmount).toBe(300_000); // bukan 30% dari totalHarga
  });

  it('array item kosong -> semua nol', () => {
    expect(computeBookingTotals([], 0)).toEqual({ totalHarga: 0, dpAmount: 0 });
  });
});

describe('validateWajibCustomFields (FR-F04-4)', () => {
  const fields = [
    { id: 'cf-1', label: 'Adat', wajib: true },
    { id: 'cf-2', label: 'Catatan tambahan', wajib: false },
  ];

  it('lolos bila field wajib terisi non-kosong', () => {
    expect(() =>
      validateWajibCustomFields(fields, [{ customFieldId: 'cf-1', nilai: 'Batak' }]),
    ).not.toThrow();
  });

  it('menolak bila field wajib tidak ada di payload sama sekali', () => {
    expect(() => validateWajibCustomFields(fields, [])).toThrow(
      BadRequestException,
    );
    expect(() => validateWajibCustomFields(fields, undefined)).toThrow(
      BadRequestException,
    );
  });

  it('menolak bila field wajib ada tapi nilai kosong/whitespace', () => {
    expect(() =>
      validateWajibCustomFields(fields, [{ customFieldId: 'cf-1', nilai: '' }]),
    ).toThrow(BadRequestException);
    expect(() =>
      validateWajibCustomFields(fields, [{ customFieldId: 'cf-1', nilai: '   ' }]),
    ).toThrow(BadRequestException);
  });

  it('tidak menolak bila field opsional tidak diisi', () => {
    expect(() =>
      validateWajibCustomFields(fields, [{ customFieldId: 'cf-1', nilai: 'Batak' }]),
    ).not.toThrow();
  });

  it('menolak customFieldId yang bukan milik tenant ini', () => {
    expect(() =>
      validateWajibCustomFields(fields, [
        { customFieldId: 'cf-1', nilai: 'Batak' },
        { customFieldId: 'cf-lain-tenant', nilai: 'x' },
      ]),
    ).toThrow(BadRequestException);
  });

  it('tidak ada field wajib sama sekali -> payload kosong lolos', () => {
    expect(() =>
      validateWajibCustomFields([{ id: 'cf-2', label: 'Opsional', wajib: false }], []),
    ).not.toThrow();
  });
});
