import { computeDpAmount, computeTransportFee } from './pricing.util';

describe('computeDpAmount', () => {
  it('menghitung DP persen dan membulatkan ke rupiah terdekat', () => {
    expect(computeDpAmount(1_000_000, 'PERSEN', 30)).toBe(300_000);
    expect(computeDpAmount(333_333, 'PERSEN', 10)).toBe(33_333); // 33333.3 → 33333
    expect(computeDpAmount(100_000, 'PERSEN', 33.5)).toBe(33_500);
  });

  it('menghitung DP nominal langsung', () => {
    expect(computeDpAmount(1_000_000, 'NOMINAL', 250_000)).toBe(250_000);
  });

  it('mengembalikan 0 untuk DP persen 0%', () => {
    expect(computeDpAmount(500_000, 'PERSEN', 0)).toBe(0);
  });

  it('clamp DP nominal agar tidak melebihi harga', () => {
    expect(computeDpAmount(200_000, 'NOMINAL', 500_000)).toBe(200_000);
  });

  it('DP nominal sama dengan harga tetap sama dengan harga', () => {
    expect(computeDpAmount(200_000, 'NOMINAL', 200_000)).toBe(200_000);
  });
});

describe('computeTransportFee', () => {
  it('mengembalikan 0 jika rule null (belum diset)', () => {
    expect(computeTransportFee(null)).toBe(0);
  });

  it('mengembalikan flatNominal untuk mode FLAT', () => {
    expect(
      computeTransportFee({ mode: 'FLAT', flatNominal: 50_000, zona: null }),
    ).toBe(50_000);
  });

  it('mengembalikan 0 untuk mode FLAT jika flatNominal null', () => {
    expect(computeTransportFee({ mode: 'FLAT', flatNominal: null, zona: null })).toBe(
      0,
    );
  });

  it('mencari nominal zona sesuai nama untuk mode ZONA', () => {
    const rule = {
      mode: 'ZONA' as const,
      flatNominal: null,
      zona: [
        { nama: 'Dalam Kota', nominal: 50_000 },
        { nama: 'Luar Kota', nominal: 150_000 },
      ],
    };
    expect(computeTransportFee(rule, 'Luar Kota')).toBe(150_000);
    expect(computeTransportFee(rule, 'Dalam Kota')).toBe(50_000);
  });

  it('mengembalikan 0 untuk mode ZONA jika zona tidak ditemukan', () => {
    const rule = {
      mode: 'ZONA' as const,
      flatNominal: null,
      zona: [{ nama: 'Dalam Kota', nominal: 50_000 }],
    };
    expect(computeTransportFee(rule, 'Zona Tidak Ada')).toBe(0);
  });

  it('mengembalikan 0 untuk mode ZONA jika zonaNama tidak dikirim', () => {
    const rule = {
      mode: 'ZONA' as const,
      flatNominal: null,
      zona: [{ nama: 'Dalam Kota', nominal: 50_000 }],
    };
    expect(computeTransportFee(rule)).toBe(0);
  });
});
