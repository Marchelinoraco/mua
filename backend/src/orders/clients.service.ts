import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parsePagination } from './orders.util';
import { UpdateClientNotesDto } from './dto/update-client-notes.dto';
import {
  ClientDetailResponseDto,
  ClientListResponseDto,
  ClientResponseDto,
} from './dto/client-response.dto';

/** Booking dianggap "aktif" untuk agregasi jumlahBookingAktif (F09). */
const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.AWAITING_DP,
  BookingStatus.CONFIRMED,
  BookingStatus.PAID,
];

const CLIENT_LIST_SELECT = {
  id: true,
  nama: true,
  phone: true,
  email: true,
  totalBooking: true,
  createdAt: true,
} satisfies Prisma.ClientSelect;

const CLIENT_DETAIL_SELECT = {
  id: true,
  nama: true,
  phone: true,
  email: true,
  catatan: true,
  totalBooking: true,
  createdAt: true,
  bookings: {
    orderBy: { tanggalAcara: 'desc' },
    take: 50,
    select: {
      id: true,
      kodeBooking: true,
      tanggalAcara: true,
      statusBooking: true,
      totalHarga: true,
    },
  },
} satisfies Prisma.ClientSelect;

const CLIENT_UPDATE_RESULT_SELECT = {
  id: true,
  nama: true,
  phone: true,
  email: true,
  catatan: true,
  totalBooking: true,
  createdAt: true,
} satisfies Prisma.ClientSelect;

/**
 * ClientsService — profil & riwayat klien (F09, FR-F09-4/5). Profil Client
 * terbentuk otomatis via upsert saat booking dibuat (lihat
 * BookingService.createBooking, F04) — modul ini hanya membaca/mengelola
 * catatan, TIDAK membuat Client baru. Semua query WAJIB tenant-scoped.
 */
@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /clients?q=&page=&limit= — daftar klien tenant, urut nama asc. */
  async list(
    tenantId: string,
    q?: string,
    pageStr?: string,
    limitStr?: string,
  ): Promise<ClientListResponseDto> {
    const { page, limit, skip } = parsePagination(pageStr, limitStr);

    const where: Prisma.ClientWhereInput = {
      tenantId,
      ...(q
        ? {
            OR: [
              { nama: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, clients] = await Promise.all([
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        where,
        orderBy: { nama: 'asc' },
        skip,
        take: limit,
        select: CLIENT_LIST_SELECT,
      }),
    ]);

    const activeCountMap = await this.countActiveBookingsByClient(
      tenantId,
      clients.map((c) => c.id),
    );

    return {
      data: clients.map((c) => ({
        id: c.id,
        nama: c.nama,
        phone: c.phone,
        email: c.email,
        totalBooking: c.totalBooking,
        createdAt: c.createdAt,
        jumlahBookingAktif: activeCountMap.get(c.id) ?? 0,
      })),
      total,
      page,
      limit,
    };
  }

  /** GET /clients/:id — profil + riwayat booking (maks 50 terbaru). 404 bila bukan milik tenant. */
  async detail(tenantId: string, id: string): Promise<ClientDetailResponseDto> {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      select: CLIENT_DETAIL_SELECT,
    });
    if (!client) {
      throw new NotFoundException('Klien tidak ditemukan.');
    }

    return {
      id: client.id,
      nama: client.nama,
      phone: client.phone,
      email: client.email,
      catatan: client.catatan,
      totalBooking: client.totalBooking,
      createdAt: client.createdAt,
      bookings: client.bookings.map((b) => ({
        id: b.id,
        kodeBooking: b.kodeBooking,
        tanggalAcara: b.tanggalAcara,
        statusBooking: b.statusBooking,
        totalHarga: Number(b.totalHarga),
      })),
    };
  }

  /** PUT /clients/:id/notes — update catatan bebas (preferensi, alergi, dll — FR-F09-5). */
  async updateNotes(
    tenantId: string,
    id: string,
    dto: UpdateClientNotesDto,
  ): Promise<ClientResponseDto> {
    const existing = await this.prisma.client.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Klien tidak ditemukan.');
    }

    return this.prisma.client.update({
      where: { id: existing.id },
      data: { catatan: dto.catatan },
      select: CLIENT_UPDATE_RESULT_SELECT,
    });
  }

  /**
   * Hitung jumlah booking aktif per klien lewat SATU query `groupBy` yang
   * dibatasi ke `clientIds` halaman berjalan (bukan N+1 query per klien).
   */
  private async countActiveBookingsByClient(
    tenantId: string,
    clientIds: string[],
  ): Promise<Map<string, number>> {
    if (clientIds.length === 0) return new Map();

    const rows = await this.prisma.booking.groupBy({
      by: ['clientId'],
      where: {
        tenantId,
        clientId: { in: clientIds },
        statusBooking: { in: ACTIVE_BOOKING_STATUSES },
      },
      _count: { _all: true },
    });

    return new Map(rows.map((row) => [row.clientId, row._count._all]));
  }
}
