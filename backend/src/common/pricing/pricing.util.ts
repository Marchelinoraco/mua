/**
 * Util kalkulasi harga — pure functions, tanpa dependensi Prisma/NestJS.
 * Dipakai oleh ServicesModule/TransportRulesModule sekarang, dan oleh F04
 * (booking) nanti untuk menghitung total & DP booking.
 *
 * Ditaruh di `common/pricing` (bukan di `services/`) karena dipakai lintas
 * modul (Service DP + TransportRule fee) dan akan direuse oleh modul Booking.
 */

export type DpTipeValue = 'PERSEN' | 'NOMINAL';
export type TransportModeValue = 'FLAT' | 'ZONA';

export interface ZonaTransport {
  nama: string;
  nominal: number;
}

export interface TransportRuleInput {
  mode: TransportModeValue;
  flatNominal: number | null;
  zona: ZonaTransport[] | null;
}

/**
 * Hitung nominal DP dari harga layanan.
 * - PERSEN: harga * dpNilai / 100, dibulatkan ke rupiah terdekat (AC-F03-1).
 * - NOMINAL: dpNilai langsung, di-clamp agar tidak melebihi harga.
 */
export function computeDpAmount(
  harga: number,
  dpTipe: DpTipeValue,
  dpNilai: number,
): number {
  if (dpTipe === 'PERSEN') {
    return Math.round((harga * dpNilai) / 100);
  }
  // NOMINAL — clamp agar DP tidak pernah melebihi harga layanan
  return Math.min(dpNilai, harga);
}

/**
 * Hitung biaya transport dari TransportRule tenant (AC-F03-2).
 * - rule null (belum diset) → 0.
 * - FLAT → flatNominal (0 jika null).
 * - ZONA → cari zona berdasarkan nama; 0 jika tidak ditemukan / zonaNama tidak dikirim.
 */
export function computeTransportFee(
  rule: TransportRuleInput | null,
  zonaNama?: string,
): number {
  if (!rule) {
    return 0;
  }
  if (rule.mode === 'FLAT') {
    return rule.flatNominal ?? 0;
  }
  // ZONA
  return rule.zona?.find((z) => z.nama === zonaNama)?.nominal ?? 0;
}
