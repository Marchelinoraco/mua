import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertPaymentProfileDto } from './dto/upsert-payment-profile.dto';
import { PaymentProfileResponseDto } from './dto/payment-profile-response.dto';

/**
 * PaymentProfileService — rekening instruksi pembayaran MUA per tenant.
 *
 * RULE-1 (nol kustodi): PaymentProfile hanya menyimpan instruksi rekening MUA
 * agar klien tahu ke mana mentransfer DP/pelunasan. Platform TIDAK pernah
 * memproses atau menerima dana — hanya mencatat instruksi & konfirmasi MUA.
 *
 * Semua query WAJIB difilter tenantId.
 */
@Injectable()
export class PaymentProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /payment-profile — ambil PaymentProfile milik tenant.
   * Throw NotFoundException jika belum diisi (belum setup onboarding).
   */
  async getPaymentProfile(tenantId: string): Promise<PaymentProfileResponseDto> {
    const profile = await this.prisma.paymentProfile.findUnique({
      where: { tenantId },
      select: {
        id: true,
        namaBank: true,
        nomorRekening: true,
        namaPemilik: true,
        instruksiTambahan: true,
        updatedAt: true,
        // tenantId TIDAK disertakan — tidak bocor ke response
      },
    });

    if (!profile) {
      throw new NotFoundException('PaymentProfile belum dikonfigurasi.');
    }

    return profile;
  }

  /**
   * PUT /payment-profile — upsert PaymentProfile milik tenant.
   * Idempoten: create bila belum ada, update bila sudah ada.
   * tenantId selalu dari JWT (tidak bisa di-override dari body).
   */
  async upsertPaymentProfile(
    tenantId: string,
    dto: UpsertPaymentProfileDto,
  ): Promise<PaymentProfileResponseDto> {
    const profile = await this.prisma.paymentProfile.upsert({
      where: { tenantId },
      create: {
        tenantId,
        namaBank: dto.namaBank,
        nomorRekening: dto.nomorRekening,
        namaPemilik: dto.namaPemilik,
        instruksiTambahan: dto.instruksiTambahan ?? null,
      },
      update: {
        namaBank: dto.namaBank,
        nomorRekening: dto.nomorRekening,
        namaPemilik: dto.namaPemilik,
        instruksiTambahan: dto.instruksiTambahan ?? null,
      },
      select: {
        id: true,
        namaBank: true,
        nomorRekening: true,
        namaPemilik: true,
        instruksiTambahan: true,
        updatedAt: true,
      },
    });

    return profile;
  }
}
