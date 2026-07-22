import { toKotaDisplayName, toTenantKotaDisplay } from './tenant-kota.util';

const REGENCY = {
  nama: 'Kota Manado',
  provinceId: 'prov-1',
  province: { nama: 'Sulawesi Utara' },
};

describe('toTenantKotaDisplay', () => {
  it('memakai data Regency (join) bila regencyId ter-mapping', () => {
    expect(
      toTenantKotaDisplay({
        kota: 'Manado', // teks lama — harus diabaikan bila regency ada
        regencyId: 'reg-1',
        regency: REGENCY,
      }),
    ).toEqual({
      regencyId: 'reg-1',
      kota: 'Kota Manado',
      provinceId: 'prov-1',
      provinsi: 'Sulawesi Utara',
    });
  });

  it('fallback ke kota teks bebas lama bila regency belum ter-mapping', () => {
    expect(
      toTenantKotaDisplay({
        kota: 'Jakarta',
        regencyId: null,
        regency: null,
      }),
    ).toEqual({
      regencyId: null,
      kota: 'Jakarta',
      provinceId: null,
      provinsi: null,
    });
  });

  it('mengembalikan semua null bila tenant belum pernah mengisi kota/regency', () => {
    expect(
      toTenantKotaDisplay({ kota: null, regencyId: null, regency: null }),
    ).toEqual({
      regencyId: null,
      kota: null,
      provinceId: null,
      provinsi: null,
    });
  });
});

describe('toKotaDisplayName', () => {
  it('mengutamakan nama Regency di atas teks lama', () => {
    expect(toKotaDisplayName({ kota: 'Manado', regency: REGENCY })).toBe(
      'Kota Manado',
    );
  });

  it('fallback ke teks lama bila regency null', () => {
    expect(toKotaDisplayName({ kota: 'Jakarta', regency: null })).toBe(
      'Jakarta',
    );
  });

  it('null bila keduanya kosong', () => {
    expect(toKotaDisplayName({ kota: null, regency: null })).toBeNull();
  });
});
