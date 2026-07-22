/**
 * Seed SEKALI-JALAN: data referensi wilayah Indonesia (Province + Regency).
 *
 * Sumber data: snapshot statis `prisma/seed-data/wilayah-indonesia.json`,
 * di-fetch SATU KALI (22 Jul 2026) dari API pihak ketiga tanpa SLA
 * `https://api-wilayah-indonesia-v1.vercel.app` — endpoint yang dipakai:
 *   - GET /api/provinces                     → { data: [{ code, name }] }
 *   - GET /api/cities?province_code={kode}   → { data: [{ code, province_code, name }] }
 * (Endpoint "cities" adalah kabupaten/kota, bukan hanya kota administratif —
 * confirmed via curl sebelum menulis script ini.)
 *
 * Kenapa divendor sebagai file JSON statis, bukan fetch live di sini:
 *   - API personal tanpa SLA — bisa berubah/mati kapan saja.
 *   - Script ini boleh dijalankan ulang (idempoten via upsert) tanpa bergantung
 *     ke jaringan/API pihak ketiga sama sekali.
 *   - Total 38 provinsi + 514 kabupaten/kota — cocok dengan jumlah resmi
 *     Kemendagri saat snapshot diambil.
 *
 * TIDAK dipanggil dari runtime backend — jalankan manual sekali:
 *   npx ts-node prisma/seed-wilayah.ts
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

interface RawProvince {
  code: string;
  name: string;
}

interface RawRegency {
  code: string;
  province_code: string;
  name: string;
}

interface RawWilayahData {
  provinces: RawProvince[];
  regencies: RawRegency[];
}

function loadRawData(): RawWilayahData {
  const filePath = path.join(__dirname, 'seed-data', 'wilayah-indonesia.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as RawWilayahData;
}

async function main() {
  const { provinces, regencies } = loadRawData();

  console.log(
    `Memuat snapshot: ${provinces.length} provinsi, ${regencies.length} kabupaten/kota.`,
  );

  // 1. Upsert Province — key unik = kode Kemendagri.
  let provinceCount = 0;
  const provinceIdByKode = new Map<string, string>();
  for (const p of provinces) {
    const saved = await prisma.province.upsert({
      where: { kode: p.code },
      update: { nama: p.name },
      create: { kode: p.code, nama: p.name },
    });
    provinceIdByKode.set(p.code, saved.id);
    provinceCount++;
  }

  // 2. Upsert Regency — key unik = kode Kemendagri; FK provinceId dari map di atas.
  let regencyCount = 0;
  let skipped = 0;
  for (const r of regencies) {
    const provinceId = provinceIdByKode.get(r.province_code);
    if (!provinceId) {
      // Tidak seharusnya terjadi (data konsisten dari sumber yang sama),
      // tapi jaga-jaga: lewati & catat alih-alih gagal total.
      console.warn(
        `Lewati regency ${r.code} (${r.name}): province_code ${r.province_code} tidak ditemukan.`,
      );
      skipped++;
      continue;
    }
    await prisma.regency.upsert({
      where: { kode: r.code },
      update: { nama: r.name, provinceId },
      create: { kode: r.code, nama: r.name, provinceId },
    });
    regencyCount++;
  }

  console.log(
    `Seed wilayah selesai: ${provinceCount} provinsi, ${regencyCount} kabupaten/kota diupsert` +
      (skipped > 0 ? ` (${skipped} dilewati — lihat warning di atas).` : '.'),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
