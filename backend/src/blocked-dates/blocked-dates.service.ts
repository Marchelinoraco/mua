import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockedDateDto } from './dto/create-blocked-date.dto';
import { BlockedDateResponseDto } from './dto/blocked-date-response.dto';
import { addDaysUtc, parseDateOnlyUtc } from '../slots/slots.util';

const BLOCKED_DATE_SELECT = {
  id: true,
  tanggalMulai: true,
  tanggalSelesai: true,
  alasan: true,
  createdAt: true,
} satisfies Prisma.BlockedDateSelect;

/**
 * BlockedDatesService — tanggal/rentang yang diblokir MUA (F05, FR-F05-2).
 * Semua query WAJIB difilter tenantId.
 */
@Injectable()
export class BlockedDatesService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /blocked-dates?from=&to= — list, filter rentang opsional (overlap). */
  async list(
    tenantId: string,
    from?: string,
    to?: string,
  ): Promise<BlockedDateResponseDto[]> {
    const and: Prisma.BlockedDateWhereInput[] = [];
    if (from) {
      and.push({ tanggalSelesai: { gte: parseDateOnlyUtc(from) } });
    }
    if (to) {
      and.push({ tanggalMulai: { lte: parseDateOnlyUtc(to) } });
    }

    return this.prisma.blockedDate.findMany({
      where: { tenantId, ...(and.length ? { AND: and } : {}) },
      orderBy: { tanggalMulai: 'asc' },
      select: BLOCKED_DATE_SELECT,
    });
  }

  /**
   * POST /blocked-dates — buat blokir tanggal/rentang.
   * Edge case wajib (F05 §9): tolak 409 bila rentang beririsan dengan booking
   * CONFIRMED/PAID existing — MUA harus memindahkan booking tersebut dulu.
   */
  async create(
    tenantId: string,
    dto: CreateBlockedDateDto,
  ): Promise<BlockedDateResponseDto> {
    const tanggalMulai = parseDateOnlyUtc(dto.tanggalMulai);
    const tanggalSelesai = parseDateOnlyUtc(dto.tanggalSelesai);

    if (tanggalMulai > tanggalSelesai) {
      throw new BadRequestException(
        'tanggalMulai tidak boleh setelah tanggalSelesai.',
      );
    }

    // Rentang inklusif [tanggalMulai, tanggalSelesai] -> exclusive end untuk query DateTime.
    const exclusiveEnd = addDaysUtc(tanggalSelesai, 1);
    const conflictCount = await this.prisma.booking.count({
      where: {
        tenantId,
        statusBooking: { in: [BookingStatus.CONFIRMED, BookingStatus.PAID] },
        tanggalAcara: { gte: tanggalMulai, lt: exclusiveEnd },
      },
    });
    if (conflictCount > 0) {
      throw new ConflictException(
        'Rentang tanggal ini memiliki booking terkonfirmasi. Pindahkan booking tersebut sebelum memblokir tanggal ini.',
      );
    }

    return this.prisma.blockedDate.create({
      data: {
        tenantId,
        tanggalMulai,
        tanggalSelesai,
        alasan: dto.alasan ?? null,
      },
      select: BLOCKED_DATE_SELECT,
    });
  }

  /** DELETE /blocked-dates/:id — cek kepemilikan tenantId dulu, lalu hapus. */
  async remove(tenantId: string, id: string): Promise<{ id: string }> {
    const existing = await this.prisma.blockedDate.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Data blokir tanggal tidak ditemukan.');
    }
    await this.prisma.blockedDate.delete({ where: { id: existing.id } });
    return { id: existing.id };
  }
}
