/**
 * Seed data global (bukan tenant-scoped): tier Plan langganan.
 * Harga & kuota masih placeholder sesuai docs/business-model.md §3.3 —
 * finalkan sebelum rilis produksi (F07).
 *
 * Jalankan: npx prisma db seed
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const plans = [
    {
      nama: 'Basic',
      harga: 20000,
      orderQuota: 30,
      tierUrutan: 1,
      fitur: ['Kuota 30 order/bulan', 'Storefront publik', 'Booking & anti-bentrok'],
    },
    {
      nama: 'Pro',
      harga: 50000,
      orderQuota: 100,
      tierUrutan: 2,
      fitur: ['Kuota 100 order/bulan', 'Semua fitur Basic', 'Laporan lanjutan'],
    },
    {
      nama: 'Bisnis',
      harga: 150000,
      orderQuota: null,
      tierUrutan: 3,
      fitur: ['Kuota unlimited', 'Semua fitur Pro', 'Dukungan prioritas'],
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tierUrutan: plan.tierUrutan },
      update: {},
      create: plan,
    });
  }

  console.log(`Seed selesai: ${plans.length} plan dibuat/dipastikan ada.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
