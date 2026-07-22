import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  WilayahProvinceDto,
  WilayahRegencyDto,
} from './dto/wilayah-response.dto';

/**
 * WilayahService — data referensi Provinsi/Kabupaten-Kota [global], read-only.
 * Diisi sekali via `prisma/seed-wilayah.ts` (bukan dipanggil API pihak ketiga
 * saat runtime). Tidak tenant-scoped — sama untuk seluruh tenant.
 */
@Injectable()
export class WilayahService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/wilayah/provinces — seluruh provinsi, urut nama asc. */
  async listProvinces(): Promise<WilayahProvinceDto[]> {
    return this.prisma.province.findMany({
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    });
  }

  /** GET /api/wilayah/regencies?provinceId= — kab/kota dalam satu provinsi, urut nama asc. */
  async listRegencies(provinceId: string): Promise<WilayahRegencyDto[]> {
    return this.prisma.regency.findMany({
      where: { provinceId },
      orderBy: { nama: 'asc' },
      select: { id: true, kode: true, nama: true },
    });
  }
}
