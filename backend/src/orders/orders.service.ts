import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../slots/slots.service';
import { buildTanggalAcaraUtc } from '../booking/booking.util';
import { addDaysUtc, parseDateOnlyUtc } from '../slots/slots.util';
import { parsePagination, parseStatusFilter } from './orders.util';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { RescheduleOrderDto } from './dto/reschedule-order.dto';
import {
  OrderDetailResponseDto,
  OrderListResponseDto,
} from './dto/order-response.dto';

/** Status booking yang masih bisa bertransisi (belum terminal) — dipakai cancel & reschedule. */
const ACTIVE_TRANSITIONABLE_STATUSES: BookingStatus[] = [
  BookingStatus.AWAITING_DP,
  BookingStatus.CONFIRMED,
  BookingStatus.PAID,
];

const ORDER_LIST_SELECT = {
  id: true,
  kodeBooking: true,
  tanggalAcara: true,
  statusBooking: true,
  totalHarga: true,
  dpAmount: true,
  holdUntil: true,
  client: { select: { id: true, nama: true, phone: true } },
  items: { select: { durasi: true } },
} satisfies Prisma.BookingSelect;

const ORDER_DETAIL_SELECT = {
  id: true,
  kodeBooking: true,
  tanggalAcara: true,
  statusBooking: true,
  totalHarga: true,
  dpAmount: true,
  holdUntil: true,
  lokasiAcara: true,
  catatan: true,
  alasanBatal: true,
  canceledAt: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: { id: true, nama: true, phone: true, email: true, catatan: true },
  },
  items: {
    select: {
      namaSnapshot: true,
      qty: true,
      hargaSnapshot: true,
      durasi: true,
    },
  },
  customValues: {
    select: {
      customFieldId: true,
      nilai: true,
      customField: { select: { label: true } },
    },
  },
} satisfies Prisma.BookingSelect;

type OrderListRow = Prisma.BookingGetPayload<{
  select: typeof ORDER_LIST_SELECT;
}>;
type OrderDetailRow = Prisma.BookingGetPayload<{
  select: typeof ORDER_DETAIL_SELECT;
}>;

export interface ListOrdersParams {
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: string;
  limit?: string;
}

/**
 * OrdersService — F09 dashboard order management. Prefix rute /orders (bukan
 * /bookings) — lihat catatan arsitektur di orders.module.ts perihal tabrakan
 * pola rute dengan F04 (GET /bookings/:kode publik). Semua query WAJIB
 * tenant-scoped; aksi by-id memakai findFirst({id, tenantId}) -> 404, TIDAK
 * PERNAH findUnique({id}) lalu cek tenant setelahnya (hindari bocor eksistensi
 * resource tenant lain).
 */
@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotsService: SlotsService,
  ) {}

  /** GET /orders?status=&from=&to=&q=&page=&limit= — daftar order, urut tanggalAcara desc. */
  async list(
    tenantId: string,
    params: ListOrdersParams,
  ): Promise<OrderListResponseDto> {
    const { page, limit, skip } = parsePagination(params.page, params.limit);
    const statuses = parseStatusFilter(params.status);

    const where: Prisma.BookingWhereInput = { tenantId };
    if (statuses) {
      where.statusBooking = { in: statuses };
    }
    if (params.from || params.to) {
      where.tanggalAcara = {
        ...(params.from ? { gte: parseDateOnlyUtc(params.from) } : {}),
        ...(params.to
          ? { lt: addDaysUtc(parseDateOnlyUtc(params.to), 1) }
          : {}),
      };
    }
    if (params.q) {
      const q = params.q;
      where.OR = [
        { kodeBooking: { contains: q, mode: 'insensitive' } },
        { client: { nama: { contains: q, mode: 'insensitive' } } },
        { client: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        orderBy: { tanggalAcara: 'desc' },
        skip,
        take: limit,
        select: ORDER_LIST_SELECT,
      }),
    ]);

    return {
      data: bookings.map((b) => this.toListItem(b)),
      total,
      page,
      limit,
    };
  }

  /** GET /orders/:id — detail lengkap. 404 bila bukan milik tenant. */
  async detail(tenantId: string, id: string): Promise<OrderDetailResponseDto> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, tenantId },
      select: ORDER_DETAIL_SELECT,
    });
    if (!booking) {
      throw new NotFoundException('Order tidak ditemukan.');
    }
    return this.toDetail(booking);
  }

  /**
   * POST /orders/:id/confirm — konfirmasi booking (FR-F09-3). Hanya valid
   * dari AWAITING_DP.
   *
   * TODO(F06): Normalnya transisi AWAITING_DP -> CONFIRMED dipicu OTOMATIS
   * saat MUA mengonfirmasi bukti pembayaran DP klien (lihat F06 — belum
   * dibangun; PaymentsService.confirmPayment akan memanggil transisi setara
   * ini secara internal). Endpoint ini adalah JEMBATAN MANUAL sampai F06
   * tersedia — MUA menekan "Konfirmasi" langsung dari dashboard order tanpa
   * verifikasi payment eksplisit. Ketika F06 selesai, evaluasi ulang apakah
   * endpoint publik ini tetap diperlukan (mis. untuk DP tunai/luar sistem)
   * atau digantikan sepenuhnya oleh alur konfirmasi pembayaran.
   */
  async confirm(tenantId: string, id: string): Promise<OrderDetailResponseDto> {
    const existing = await this.findOwnedOrThrow(tenantId, id);
    this.assertTransition('dikonfirmasi', existing.statusBooking, [
      BookingStatus.AWAITING_DP,
    ]);

    await this.prisma.$transaction(async (tx) => {
      // Update kondisional (bukan update polos) — WHERE menyertakan status
      // asal sebagai guard atomik terhadap race (mis. dua klik konfirmasi
      // bersamaan, atau status berubah di antara findOwnedOrThrow & tx ini).
      const result = await tx.booking.updateMany({
        where: { id, tenantId, statusBooking: BookingStatus.AWAITING_DP },
        data: { statusBooking: BookingStatus.CONFIRMED, holdUntil: null },
      });
      if (result.count === 0) {
        throw new ConflictException(
          'Booking sudah berubah status sebelum konfirmasi diproses.',
        );
      }

      // Increment ATOMIK (bukan baca-lalu-tulis) — item wajib roadmap handoff.
      // Client.totalBooking adalah counter LIFETIME booking yang PERNAH
      // dikonfirmasi, bukan jumlah booking aktif saat ini — karena itu
      // TIDAK di-decrement saat cancel (lihat cancel() di bawah).
      await tx.client.update({
        where: { id: existing.clientId },
        data: { totalBooking: { increment: 1 } },
      });
    });

    return this.detail(tenantId, id);
  }

  /** POST /orders/:id/complete — tandai selesai. Hanya valid dari CONFIRMED/PAID. */
  async complete(
    tenantId: string,
    id: string,
  ): Promise<OrderDetailResponseDto> {
    const existing = await this.findOwnedOrThrow(tenantId, id);
    this.assertTransition('ditandai selesai', existing.statusBooking, [
      BookingStatus.CONFIRMED,
      BookingStatus.PAID,
    ]);

    const result = await this.prisma.booking.updateMany({
      where: {
        id,
        tenantId,
        statusBooking: { in: [BookingStatus.CONFIRMED, BookingStatus.PAID] },
      },
      data: { statusBooking: BookingStatus.COMPLETED },
    });
    if (result.count === 0) {
      throw new ConflictException(
        'Booking sudah berubah status sebelum ditandai selesai.',
      );
    }
    return this.detail(tenantId, id);
  }

  /**
   * POST /orders/:id/cancel — batalkan + catat alasan (juga berfungsi sebagai
   * catatan refund manual, di luar platform — RULE-1 non-kustodi).
   * Client.totalBooking TIDAK di-decrement — lihat catatan di confirm().
   */
  async cancel(
    tenantId: string,
    id: string,
    dto: CancelOrderDto,
  ): Promise<OrderDetailResponseDto> {
    const existing = await this.findOwnedOrThrow(tenantId, id);
    this.assertTransition(
      'dibatalkan',
      existing.statusBooking,
      ACTIVE_TRANSITIONABLE_STATUSES,
    );

    const result = await this.prisma.booking.updateMany({
      where: {
        id,
        tenantId,
        statusBooking: { in: ACTIVE_TRANSITIONABLE_STATUSES },
      },
      data: {
        statusBooking: BookingStatus.CANCELED,
        alasanBatal: dto.alasan,
        canceledAt: new Date(),
        holdUntil: null,
      },
    });
    if (result.count === 0) {
      throw new ConflictException(
        'Booking sudah berubah status sebelum pembatalan diproses.',
      );
    }
    return this.detail(tenantId, id);
  }

  /**
   * POST /orders/:id/reschedule — pindah tanggal/jam. WAJIB lolos anti-bentrok
   * (AC-F09-2) via SlotsService.reserveSlotOrThrow di dalam transaksi yang
   * sama dengan update tanggalAcara. `excludeBookingId=id` dikirim agar
   * booking ini sendiri TIDAK dihitung sebagai okupansi (fix bug self-conflict
   * — lihat komentar reserveSlotOrThrow di slots.service.ts).
   */
  async reschedule(
    tenantId: string,
    id: string,
    dto: RescheduleOrderDto,
  ): Promise<OrderDetailResponseDto> {
    const existing = await this.findOwnedWithItemsOrThrow(tenantId, id);
    this.assertTransition(
      'di-reschedule',
      existing.statusBooking,
      ACTIVE_TRANSITIONABLE_STATUSES,
    );

    const tanggalAcaraBaru = buildTanggalAcaraUtc(
      dto.tanggalAcara,
      dto.jamMulai,
    );
    const durasiTotal = existing.items.reduce(
      (sum, item) => sum + item.durasi,
      0,
    );

    await this.prisma.$transaction(async (tx) => {
      await this.slotsService.reserveSlotOrThrow(
        tx,
        tenantId,
        tanggalAcaraBaru,
        durasiTotal,
        id,
      );

      const result = await tx.booking.updateMany({
        where: {
          id,
          tenantId,
          statusBooking: { in: ACTIVE_TRANSITIONABLE_STATUSES },
        },
        data: { tanggalAcara: tanggalAcaraBaru },
      });
      if (result.count === 0) {
        throw new ConflictException(
          'Booking sudah berubah status sebelum reschedule diproses.',
        );
      }
    });

    return this.detail(tenantId, id);
  }

  /** Cari booking milik tenant (kolom minimal untuk transisi status); 404 jika tidak ketemu/beda tenant. */
  private async findOwnedOrThrow(
    tenantId: string,
    id: string,
  ): Promise<{ id: string; clientId: string; statusBooking: BookingStatus }> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, tenantId },
      select: { id: true, clientId: true, statusBooking: true },
    });
    if (!booking) {
      throw new NotFoundException('Order tidak ditemukan.');
    }
    return booking;
  }

  /** Sama seperti findOwnedOrThrow, ditambah items.durasi (dibutuhkan reschedule). */
  private async findOwnedWithItemsOrThrow(
    tenantId: string,
    id: string,
  ): Promise<{
    id: string;
    clientId: string;
    statusBooking: BookingStatus;
    items: { durasi: number }[];
  }> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        clientId: true,
        statusBooking: true,
        items: { select: { durasi: true } },
      },
    });
    if (!booking) {
      throw new NotFoundException('Order tidak ditemukan.');
    }
    return booking;
  }

  /**
   * Tegakkan state machine F09 — 409 + pesan jelas bila status booking saat
   * ini tidak termasuk daftar status asal yang diizinkan untuk aksi tsb.
   * Status terminal (COMPLETED/CANCELED/EXPIRED) otomatis tertolak di semua
   * aksi karena tidak pernah masuk allowedFrom manapun.
   */
  private assertTransition(
    actionLabel: string,
    current: BookingStatus,
    allowedFrom: BookingStatus[],
  ): void {
    if (!allowedFrom.includes(current)) {
      throw new ConflictException(
        `Booking berstatus ${current} tidak bisa ${actionLabel}.`,
      );
    }
  }

  private toListItem(booking: OrderListRow) {
    return {
      id: booking.id,
      kodeBooking: booking.kodeBooking,
      tanggalAcara: booking.tanggalAcara,
      statusBooking: booking.statusBooking,
      totalHarga: Number(booking.totalHarga),
      dpAmount: Number(booking.dpAmount),
      holdUntil: booking.holdUntil,
      client: booking.client,
      totalDurasiMenit: booking.items.reduce(
        (sum, item) => sum + item.durasi,
        0,
      ),
      jumlahItem: booking.items.length,
    };
  }

  private toDetail(booking: OrderDetailRow): OrderDetailResponseDto {
    return {
      id: booking.id,
      kodeBooking: booking.kodeBooking,
      tanggalAcara: booking.tanggalAcara,
      statusBooking: booking.statusBooking,
      totalHarga: Number(booking.totalHarga),
      dpAmount: Number(booking.dpAmount),
      holdUntil: booking.holdUntil,
      lokasiAcara: booking.lokasiAcara,
      catatan: booking.catatan,
      alasanBatal: booking.alasanBatal,
      canceledAt: booking.canceledAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      client: booking.client,
      items: booking.items.map((item) => ({
        namaSnapshot: item.namaSnapshot,
        qty: item.qty,
        hargaSnapshot: Number(item.hargaSnapshot),
        durasi: item.durasi,
      })),
      customValues: booking.customValues.map((cv) => ({
        customFieldId: cv.customFieldId,
        label: cv.customField.label,
        nilai: cv.nilai,
      })),
    };
  }
}
