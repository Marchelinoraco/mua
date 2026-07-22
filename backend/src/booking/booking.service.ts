import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../slots/slots.service';
import { computeTransportFee } from '../common/pricing/pricing.util';
import {
  buildTanggalAcaraUtc,
  computeBookingTotals,
  generateKodeBooking,
  validateWajibCustomFields,
} from './booking.util';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  BookingStatusDetailResponseDto,
  BookingStatusResponseDto,
  CreateBookingResponseDto,
} from './dto/booking-response.dto';

/** Hold slot 120 menit sejak submit (FR-F04-5). */
const HOLD_DURATION_MS = 120 * 60 * 1000;
/** Maksimal percobaan ulang saat kodeBooking bentrok (unique constraint P2002). */
const MAX_KODE_BOOKING_RETRY = 5;

const TENANT_SELECT_FOR_BOOKING = {
  id: true,
  status: true,
  transportRule: {
    select: { mode: true, flatNominal: true, zona: true },
  },
} satisfies Prisma.TenantSelect;

const PAYMENT_PROFILE_SELECT = {
  namaBank: true,
  nomorRekening: true,
  namaPemilik: true,
  instruksiTambahan: true,
} satisfies Prisma.PaymentProfileSelect;

const SERVICE_SELECT_FOR_BOOKING = {
  id: true,
  nama: true,
  harga: true,
  durasi: true,
  dpTipe: true,
  dpNilai: true,
  butuhTransport: true,
} satisfies Prisma.ServiceSelect;

const BOOKING_ITEM_SELECT = {
  namaSnapshot: true,
  qty: true,
  hargaSnapshot: true,
  durasi: true,
} satisfies Prisma.BookingItemSelect;

const BOOKING_CREATE_RESULT_SELECT = {
  kodeBooking: true,
  statusBooking: true,
  tanggalAcara: true,
  holdUntil: true,
  totalHarga: true,
  dpAmount: true,
  items: { select: BOOKING_ITEM_SELECT },
} satisfies Prisma.BookingSelect;

type TenantForBooking = Prisma.TenantGetPayload<{
  select: typeof TENANT_SELECT_FOR_BOOKING;
}>;

/**
 * BookingService — F04 Booking Mandiri oleh Klien. Endpoint PUBLIK (kecuali
 * konsol admin tidak terlibat di sini). Semua query WAJIB tenant-scoped
 * (satu-satunya query lintas-tenant yang sah adalah resolusi tenant dari
 * slug, sama seperti StorefrontService/SlotsService — F02/F05).
 */
@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotsService: SlotsService,
  ) {}

  /**
   * POST /s/:slug/bookings — buat booking + hold slot 120 menit (FR-F04-5).
   *
   * Desain retry kodeBooking: percobaan create dibungkus PER-ATTEMPT dalam
   * `prisma.$transaction` TERPISAH (bukan satu transaksi dengan SAVEPOINT
   * manual). Alasan: begitu satu statement di dalam transaksi Postgres gagal
   * (unique violation P2002), seluruh transaksi masuk status "aborted" dan
   * TIDAK BISA melanjutkan statement lain kecuali ROLLBACK — jadi retry
   * dengan kodeBooking baru pada tx yang sama tidak mungkin tanpa SAVEPOINT.
   * Alih-alih menambah kompleksitas SAVEPOINT untuk kasus yang secara
   * probabilistik nyaris tidak pernah terjadi (36^4 ≈ 1.68 juta kombinasi
   * per tenant per hari), setiap percobaan mengulang SELURUH transaksi
   * (termasuk reserveSlotOrThrow) dengan kodeBooking baru. reserveSlotOrThrow
   * aman diulang — advisory lock terlepas otomatis saat rollback.
   *
   * ConflictException dari reserveSlotOrThrow (slot penuh/diblokir) TIDAK
   * di-retry — langsung dilempar sebagai 409 (slot memang bentrok, mengulang
   * dengan kodeBooking baru tidak akan membantu).
   */
  async createBooking(
    slug: string,
    dto: CreateBookingDto,
  ): Promise<CreateBookingResponseDto> {
    const tenant = await this.resolveBookableTenantOrThrow(slug);
    const services = await this.loadActiveServicesOrThrow(
      tenant.id,
      dto.serviceIds,
    );

    const durasiTotal = services.reduce((sum, s) => sum + s.durasi, 0);
    const butuhTransport = services.some((s) => s.butuhTransport);
    const transportFee = butuhTransport
      ? computeTransportFee(
          tenant.transportRule
            ? {
                mode: tenant.transportRule.mode,
                flatNominal:
                  tenant.transportRule.flatNominal === null
                    ? null
                    : Number(tenant.transportRule.flatNominal),
                zona:
                  (tenant.transportRule.zona as
                    { nama: string; nominal: number }[] | null) ?? null,
              }
            : null,
          dto.zonaNama,
        )
      : 0;

    const itemsPricing = services.map((s) => ({
      serviceId: s.id,
      namaSnapshot: s.nama,
      hargaSnapshot: Number(s.harga),
      durasi: s.durasi,
      dpTipe: s.dpTipe,
      dpNilai: Number(s.dpNilai),
    }));
    const { totalHarga, dpAmount } = computeBookingTotals(
      itemsPricing.map((i) => ({
        harga: i.hargaSnapshot,
        dpTipe: i.dpTipe,
        dpNilai: i.dpNilai,
      })),
      transportFee,
    );

    // Validasi custom field wajib SEBELUM transaksi dimulai (bukan di dalamnya).
    const customFields = await this.prisma.customField.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, label: true, wajib: true },
    });
    validateWajibCustomFields(customFields, dto.customValues);

    const tanggalAcaraDT = buildTanggalAcaraUtc(dto.tanggalAcara, dto.jamMulai);

    let lastCollisionError: unknown;
    for (let attempt = 0; attempt < MAX_KODE_BOOKING_RETRY; attempt++) {
      const kodeBooking = generateKodeBooking(tanggalAcaraDT);
      try {
        const booking = await this.prisma.$transaction(async (tx) => {
          // Kunci anti-bentrok (FR-F05-7) — WAJIB sebelum booking.create.
          await this.slotsService.reserveSlotOrThrow(
            tx,
            tenant.id,
            tanggalAcaraDT,
            durasiTotal,
          );

          // Upsert Client by [tenantId, phone]. Sengaja TIDAK mengubah data
          // klien yang sudah ada (update: {}) — hindari menimpa profil klien
          // existing dengan data yang mungkin typo di booking baru ini.
          // totalBooking TIDAK di-increment di sini (tugas F06 saat CONFIRMED).
          const client = await tx.client.upsert({
            where: {
              tenantId_phone: { tenantId: tenant.id, phone: dto.client.phone },
            },
            create: {
              tenantId: tenant.id,
              nama: dto.client.nama,
              phone: dto.client.phone,
              email: dto.client.email ?? null,
            },
            update: {},
            select: { id: true },
          });

          return tx.booking.create({
            data: {
              tenantId: tenant.id,
              clientId: client.id,
              kodeBooking,
              tanggalAcara: tanggalAcaraDT,
              lokasiAcara: dto.lokasiAcara ?? null,
              catatan: dto.catatan ?? null,
              totalHarga,
              dpAmount,
              holdUntil: new Date(Date.now() + HOLD_DURATION_MS),
              items: {
                create: itemsPricing.map((i) => ({
                  serviceId: i.serviceId,
                  namaSnapshot: i.namaSnapshot,
                  hargaSnapshot: i.hargaSnapshot,
                  durasi: i.durasi,
                })),
              },
              customValues: {
                create: (dto.customValues ?? []).map((v) => ({
                  customFieldId: v.customFieldId,
                  nilai: v.nilai,
                })),
              },
            },
            select: BOOKING_CREATE_RESULT_SELECT,
          });
        });

        const paymentProfile = await this.prisma.paymentProfile.findUnique({
          where: { tenantId: tenant.id },
          select: PAYMENT_PROFILE_SELECT,
        });

        return {
          kodeBooking: booking.kodeBooking,
          statusBooking: booking.statusBooking,
          tanggalAcara: booking.tanggalAcara,
          holdUntil: booking.holdUntil!,
          totalHarga: Number(booking.totalHarga),
          dpAmount: Number(booking.dpAmount),
          paymentProfile: paymentProfile ?? null,
          items: booking.items.map((item) => ({
            namaSnapshot: item.namaSnapshot,
            qty: item.qty,
            hargaSnapshot: Number(item.hargaSnapshot),
            durasi: item.durasi,
          })),
        };
      } catch (error) {
        // Slot penuh/diblokir — jangan ditelan, jangan retry (409 apa adanya).
        if (error instanceof ConflictException) {
          throw error;
        }
        if (this.isKodeBookingCollision(error)) {
          lastCollisionError = error;
          continue; // retry dengan kodeBooking baru
        }
        throw error;
      }
    }

    throw new InternalServerErrorException(
      'Gagal membuat kodeBooking unik setelah beberapa percobaan.',
      { cause: lastCollisionError as Error | undefined },
    );
  }

  /**
   * GET /bookings/:kode — status booking publik (FR-F04-7).
   *
   * TODO(F08 — verifikasi WA nyata): endpoint OTP asli (`POST
   * /bookings/:kode/verify-otp`) belum tersedia (lihat booking-status.controller.ts,
   * selalu 501 mengikuti pola auth.controller.ts H-2 — TIDAK PERNAH membuat
   * OTP palsu yang selalu sukses). SEBAGAI WORKAROUND SEMENTARA sampai F08
   * (integrasi WhatsApp Business API) siap: parameter query `?phone=` opsional
   * di endpoint ini dicocokkan dengan `booking.client.phone`; jika cocok,
   * detail penuh booking dikembalikan (verifikasi ringan by phone match, BUKAN
   * OTP asli — nomor WA bukan rahasia kriptografis, ini proteksi lemah).
   * Endpoint ini juga di-throttle ketat di controller untuk membatasi brute-force
   * pencocokan nomor telepon.
   *
   * Tanpa `phone` yang cocok: hanya info minimal (tanpa nama klien/harga/lokasi)
   * — mencegah kodeBooking saja dipakai untuk mengintip data booking orang lain.
   */
  async getBookingStatus(
    kode: string,
    phone?: string,
  ): Promise<BookingStatusResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { kodeBooking: kode },
      select: {
        tenantId: true,
        kodeBooking: true,
        statusBooking: true,
        tanggalAcara: true,
        holdUntil: true,
        lokasiAcara: true,
        catatan: true,
        totalHarga: true,
        dpAmount: true,
        client: { select: { nama: true, phone: true, email: true } },
        items: { select: BOOKING_ITEM_SELECT },
        // F06 — hanya dipetakan ke response saat phone match (lihat di bawah);
        // tetap di-select di sini (satu query, hindari N+1) supaya path
        // "phone cocok" tidak perlu round-trip Prisma tambahan.
        payments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            tipe: true,
            jumlah: true,
            status: true,
            buktiFotoUrl: true,
            catatanKlien: true,
            catatanMua: true,
            confirmedAt: true,
            createdAt: true,
          },
        },
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan.');
    }

    if (!phone || phone !== booking.client.phone) {
      return {
        requiresOtp: true,
        kodeBooking: booking.kodeBooking,
        statusBooking: booking.statusBooking,
        tanggalAcara: booking.tanggalAcara,
      };
    }

    const paymentProfile = await this.prisma.paymentProfile.findUnique({
      where: { tenantId: booking.tenantId },
      select: PAYMENT_PROFILE_SELECT,
    });

    const detail: BookingStatusDetailResponseDto = {
      requiresOtp: false,
      kodeBooking: booking.kodeBooking,
      statusBooking: booking.statusBooking,
      tanggalAcara: booking.tanggalAcara,
      holdUntil: booking.holdUntil,
      lokasiAcara: booking.lokasiAcara,
      catatan: booking.catatan,
      totalHarga: Number(booking.totalHarga),
      dpAmount: Number(booking.dpAmount),
      client: {
        nama: booking.client.nama,
        phone: booking.client.phone,
        email: booking.client.email,
      },
      items: booking.items.map((item) => ({
        namaSnapshot: item.namaSnapshot,
        qty: item.qty,
        hargaSnapshot: Number(item.hargaSnapshot),
        durasi: item.durasi,
      })),
      paymentProfile: paymentProfile ?? null,
      payments: booking.payments.map((p) => ({
        id: p.id,
        tipe: p.tipe,
        jumlah: Number(p.jumlah),
        status: p.status,
        buktiFotoUrl: p.buktiFotoUrl,
        catatanKlien: p.catatanKlien,
        catatanMua: p.catatanMua,
        confirmedAt: p.confirmedAt,
        createdAt: p.createdAt,
      })),
    };
    return detail;
  }

  /** 404 bila slug tak ada, CANCELED, atau RESTRICTED (tenant tidak menerima booking). */
  private async resolveBookableTenantOrThrow(
    slug: string,
  ): Promise<TenantForBooking> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: TENANT_SELECT_FOR_BOOKING,
    });
    if (
      !tenant ||
      tenant.status === TenantStatus.CANCELED ||
      tenant.status === TenantStatus.RESTRICTED
    ) {
      throw new NotFoundException(
        'Storefront tidak ditemukan atau sedang tidak menerima booking.',
      );
    }
    return tenant;
  }

  /** Load service by id+tenantId+aktif=true; 400 bila ada id yang tidak ketemu. */
  private async loadActiveServicesOrThrow(
    tenantId: string,
    serviceIds: string[],
  ) {
    // MVP: qty diasumsikan 1/service — dedup id duplikat di request klien.
    const uniqueIds = Array.from(new Set(serviceIds));
    const services = await this.prisma.service.findMany({
      where: { id: { in: uniqueIds }, tenantId, aktif: true },
      select: SERVICE_SELECT_FOR_BOOKING,
    });
    if (services.length !== uniqueIds.length) {
      throw new BadRequestException('Layanan tidak tersedia.');
    }
    return services;
  }

  private isKodeBookingCollision(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      String(error.meta?.target ?? '').includes('kodeBooking')
    );
  }
}
