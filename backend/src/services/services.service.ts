import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DpTipe, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ToggleServiceStatusDto } from './dto/toggle-service-status.dto';
import { ServiceResponseDto } from './dto/service-response.dto';

/** Kolom yang dipilih dari Prisma — tenantId sengaja dikecualikan dari response. */
const SERVICE_SELECT = {
  id: true,
  nama: true,
  deskripsi: true,
  harga: true,
  durasi: true,
  tipe: true,
  dpTipe: true,
  dpNilai: true,
  butuhTransport: true,
  aktif: true,
  urutanTampil: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceSelect;

type ServiceRow = Prisma.ServiceGetPayload<{ select: typeof SERVICE_SELECT }>;

/**
 * ServicesService — katalog layanan MUA per tenant (F03).
 * Semua query WAJIB difilter tenantId.
 *
 * FR-F03-6: Service TIDAK PERNAH dihapus (hard delete) — hanya dinonaktifkan
 * via PATCH { aktif } — agar riwayat BookingItem lama tetap valid.
 */
@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /services — list layanan tenant, urut urutanTampil asc lalu createdAt asc. */
  async listServices(
    tenantId: string,
    aktif?: boolean,
  ): Promise<ServiceResponseDto[]> {
    const services = await this.prisma.service.findMany({
      where: {
        tenantId,
        ...(aktif !== undefined ? { aktif } : {}),
      },
      orderBy: [{ urutanTampil: 'asc' }, { createdAt: 'asc' }],
      select: SERVICE_SELECT,
    });

    return services.map((service) => this.toResponseDto(service));
  }

  /** POST /services — buat layanan baru milik tenant yang login. */
  async createService(
    tenantId: string,
    dto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    const dpTipe = dto.dpTipe ?? DpTipe.PERSEN;
    this.assertDpNilaiValid(dpTipe, dto.dpNilai);

    const service = await this.prisma.service.create({
      data: {
        tenantId,
        nama: dto.nama,
        deskripsi: dto.deskripsi ?? null,
        harga: dto.harga,
        durasi: dto.durasi,
        tipe: dto.tipe,
        dpTipe,
        dpNilai: dto.dpNilai,
        butuhTransport: dto.butuhTransport ?? false,
        urutanTampil: dto.urutanTampil ?? 0,
      },
      select: SERVICE_SELECT,
    });

    return this.toResponseDto(service);
  }

  /**
   * PUT /services/:id — update partial. Tenant-scoped: 404 jika service
   * milik tenant lain atau tidak ditemukan.
   * Validasi dpNilai<=100 (jika dpTipe efektif = PERSEN) dilakukan dengan
   * menggabungkan nilai baru dengan data lama, karena dpTipe & dpNilai bisa
   * dikirim di request terpisah.
   */
  async updateService(
    tenantId: string,
    id: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    const existing = await this.findOwnedOrThrow(tenantId, id);

    const effectiveDpTipe = dto.dpTipe ?? existing.dpTipe;
    const effectiveDpNilai = dto.dpNilai ?? Number(existing.dpNilai);
    this.assertDpNilaiValid(effectiveDpTipe, effectiveDpNilai);

    const service = await this.prisma.service.update({
      where: { id: existing.id },
      data: {
        nama: dto.nama,
        deskripsi: dto.deskripsi,
        harga: dto.harga,
        durasi: dto.durasi,
        tipe: dto.tipe,
        dpTipe: dto.dpTipe,
        dpNilai: dto.dpNilai,
        butuhTransport: dto.butuhTransport,
        urutanTampil: dto.urutanTampil,
      },
      select: SERVICE_SELECT,
    });

    return this.toResponseDto(service);
  }

  /** PATCH /services/:id — toggle aktif/nonaktif. Tidak ada endpoint DELETE (FR-F03-6). */
  async toggleServiceStatus(
    tenantId: string,
    id: string,
    dto: ToggleServiceStatusDto,
  ): Promise<ServiceResponseDto> {
    const existing = await this.findOwnedOrThrow(tenantId, id);

    const service = await this.prisma.service.update({
      where: { id: existing.id },
      data: { aktif: dto.aktif },
      select: SERVICE_SELECT,
    });

    return this.toResponseDto(service);
  }

  /** Cari Service milik tenant; 404 jika tidak ada/milik tenant lain. */
  private async findOwnedOrThrow(
    tenantId: string,
    id: string,
  ): Promise<ServiceRow> {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId },
      select: SERVICE_SELECT,
    });
    if (!service) {
      throw new NotFoundException('Layanan tidak ditemukan.');
    }
    return service;
  }

  /** dpNilai (persen) tidak boleh melebihi 100. NOMINAL bebas (>=0, sudah divalidasi DTO). */
  private assertDpNilaiValid(dpTipe: DpTipe, dpNilai: number): void {
    if (dpTipe === DpTipe.PERSEN && dpNilai > 100) {
      throw new BadRequestException(
        'dpNilai (persen) tidak boleh melebihi 100.',
      );
    }
  }

  private toResponseDto(service: ServiceRow): ServiceResponseDto {
    return {
      id: service.id,
      nama: service.nama,
      deskripsi: service.deskripsi,
      harga: Number(service.harga),
      durasi: service.durasi,
      tipe: service.tipe,
      dpTipe: service.dpTipe,
      dpNilai: Number(service.dpNilai),
      butuhTransport: service.butuhTransport,
      aktif: service.aktif,
      urutanTampil: service.urutanTampil,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
