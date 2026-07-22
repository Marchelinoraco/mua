/**
 * Migrasi data SEKALI-JALAN: `Tenant.kota` (teks bebas lama) → `Tenant.regencyId`
 * (rujukan terstruktur ke Regency), best-effort name matching.
 *
 * Konteks: migrasi skema (lihat `add_wilayah_reference`) menambahkan
 * `Tenant.regencyId` secara ADDITIVE — kolom `kota` lama TIDAK dihapus.
 * Script ini HANYA mengisi `regencyId` untuk tenant yang kota-nya bisa
 * dicocokkan dengan yakin ke satu baris Regency; sisanya dibiarkan
 * `regencyId = null` (kota lama tetap tersimpan apa adanya, tidak hilang).
 *
 * Strategi pencocokan (per tenant, urutan prioritas):
 *   1. Exact match (case-insensitive, whitespace dirapikan) ke Regency.nama
 *      penuh (mis. kota="Kota Manado" ↔ Regency.nama="Kota Manado").
 *   2. Bila tidak exact/ambigu: strip prefix "Kota"/"Kabupaten"/"Kab." dari
 *      KEDUA sisi lalu bandingkan (mis. kota="Manado" ↔ "Kota Manado" setelah
 *      di-strip jadi "manado" == "manado").
 *   Jika hasil pencocokan ambigu (>1 kandidat) atau tidak ada sama sekali →
 *   dilewati & dilaporkan sebagai TIDAK TER-MAPPING (butuh review manual).
 *
 * TIDAK dipanggil dari runtime backend — jalankan manual sekali:
 *   npx ts-node prisma/migrate-tenant-kota.ts
 *
 * Aman dijalankan ulang (idempoten): hanya memproses tenant yang
 * `regencyId` masih null.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PREFIX_RE = /^(kota|kabupaten|kab\.?)\s+/i;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function stripPrefix(s: string): string {
  return normalize(s).replace(PREFIX_RE, '');
}

interface RegencyRow {
  id: string;
  nama: string;
}

function buildIndex(regencies: RegencyRow[]) {
  const exactMap = new Map<string, RegencyRow[]>();
  const strippedMap = new Map<string, RegencyRow[]>();
  for (const r of regencies) {
    const exactKey = normalize(r.nama);
    exactMap.set(exactKey, [...(exactMap.get(exactKey) ?? []), r]);
    const strippedKey = stripPrefix(r.nama);
    strippedMap.set(strippedKey, [...(strippedMap.get(strippedKey) ?? []), r]);
  }
  return { exactMap, strippedMap };
}

function findMatch(
  kota: string,
  index: ReturnType<typeof buildIndex>,
): RegencyRow | null {
  const exact = index.exactMap.get(normalize(kota));
  if (exact && exact.length === 1) return exact[0];

  const stripped = index.strippedMap.get(stripPrefix(kota));
  if (stripped && stripped.length === 1) return stripped[0];

  return null;
}

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { kota: { not: null }, regencyId: null },
    select: { id: true, slug: true, kota: true },
  });

  console.log(
    `Ditemukan ${tenants.length} tenant dengan kota (teks bebas) terisi & regencyId belum diisi.`,
  );

  if (tenants.length === 0) {
    console.log('Tidak ada yang perlu dimigrasi.');
    return;
  }

  const regencies = await prisma.regency.findMany({
    select: { id: true, nama: true },
  });
  const index = buildIndex(regencies);

  let matched = 0;
  const unmapped: { id: string; slug: string; kota: string }[] = [];

  for (const t of tenants) {
    const kota = t.kota!;
    const match = findMatch(kota, index);
    if (match) {
      await prisma.tenant.update({
        where: { id: t.id },
        data: { regencyId: match.id },
      });
      console.log(
        `MATCH   tenant "${t.slug}": kota="${kota}" -> Regency "${match.nama}" (${match.id})`,
      );
      matched++;
    } else {
      unmapped.push({ id: t.id, slug: t.slug, kota });
    }
  }

  console.log(
    `\nSelesai: ${matched}/${tenants.length} tenant ter-mapping ke regencyId.`,
  );
  if (unmapped.length > 0) {
    console.log(
      `${unmapped.length} tenant TIDAK ter-mapping (regencyId dibiarkan null, kolom \`kota\` lama tetap tersimpan apa adanya — butuh review manual):`,
    );
    for (const u of unmapped) {
      console.log(`  - slug="${u.slug}" id=${u.id} kota="${u.kota}"`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
