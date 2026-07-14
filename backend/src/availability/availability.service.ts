import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertAvailabilityItemDto } from './dto/upsert-availability-item.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';

/** Kolom yang dipilih dari Prisma — tenantId sengaja dikecualikan dari response. */
export const AVAILABILITY_SELECT = {
  id: true,
  hari: true,
  jamMulai: true,
  jamSelesai: true,
  slotDurasi: true,
  kapasitas: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AvailabilitySelect;

/**
 * AvailabilityService — jam kerja MUA per hari (F05, FR-F05-1).
 * Semua query WAJIB difilter tenantId.
 */
@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /availability — list aturan jam kerja tenant, urut hari asc. */
  async listAvailability(tenantId: string): Promise<AvailabilityResponseDto[]> {
    return this.prisma.availability.findMany({
      where: { tenantId },
      orderBy: { hari: 'asc' },
      select: AVAILABILITY_SELECT,
    });
  }

  /**
   * PUT /availability — replace-all dalam satu transaksi:
   * - Hari yang tidak dikirim (atau dikirim dengan aktif=false) DIHAPUS.
   * - Hari yang dikirim di-upsert (create/update by @@unique([tenantId, hari])).
   */
  async upsertAll(
    tenantId: string,
    items: UpsertAvailabilityItemDto[],
  ): Promise<AvailabilityResponseDto[]> {
    items.forEach((item) => this.assertItemValid(item));

    const hariSeen = new Set<number>();
    for (const item of items) {
      if (hariSeen.has(item.hari)) {
        throw new BadRequestException(
          `Hari ${item.hari} muncul lebih dari sekali dalam payload.`,
        );
      }
      hariSeen.add(item.hari);
    }

    const activeItems = items.filter((item) => item.aktif !== false);
    const activeHariList = activeItems.map((item) => item.hari);

    return this.prisma.$transaction(async (tx) => {
      // Hapus hari yang tidak dikirim / dinonaktifkan (replace-all).
      await tx.availability.deleteMany({
        where: {
          tenantId,
          hari: activeHariList.length ? { notIn: activeHariList } : undefined,
        },
      });

      for (const item of activeItems) {
        await tx.availability.upsert({
          where: { tenantId_hari: { tenantId, hari: item.hari } },
          create: {
            tenantId,
            hari: item.hari,
            jamMulai: item.jamMulai,
            jamSelesai: item.jamSelesai,
            slotDurasi: item.slotDurasi,
            kapasitas: item.kapasitas ?? 1,
          },
          update: {
            jamMulai: item.jamMulai,
            jamSelesai: item.jamSelesai,
            slotDurasi: item.slotDurasi,
            kapasitas: item.kapasitas ?? 1,
          },
        });
      }

      return tx.availability.findMany({
        where: { tenantId },
        orderBy: { hari: 'asc' },
        select: AVAILABILITY_SELECT,
      });
    });
  }

  /** Validasi bisnis: 0<=hari<=6 (sudah divalidasi DTO), rentang jam & slotDurasi konsisten. */
  private assertItemValid(item: UpsertAvailabilityItemDto): void {
    if (item.jamMulai >= item.jamSelesai) {
      throw new BadRequestException(
        `Hari ${item.hari}: jamMulai harus lebih kecil dari jamSelesai.`,
      );
    }
    const kapasitas = item.kapasitas ?? 1;
    if (kapasitas < 1) {
      throw new BadRequestException(`Hari ${item.hari}: kapasitas minimal 1.`);
    }
    if (item.jamSelesai - item.jamMulai < item.slotDurasi) {
      throw new BadRequestException(
        `Hari ${item.hari}: rentang jam kerja lebih kecil dari slotDurasi.`,
      );
    }
  }
}
