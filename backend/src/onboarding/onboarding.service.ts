import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ChecklistResponseDto {
  hasService: boolean;
  hasPaymentProfile: boolean;
  isReady: boolean;
}

/**
 * OnboardingService — checklist minimum storefront per tenant.
 * Semua query WAJIB difilter tenantId.
 *
 * TODO F05: tambahkan hasAvailability (jam tersedia) ke checklist
 *           saat modul Availability dibangun.
 */
@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kembalikan status checklist minimum agar storefront bisa tayang.
   * hasService     = ada ≥1 Service dengan aktif=true milik tenant.
   * hasPaymentProfile = ada PaymentProfile untuk tenant.
   * isReady        = keduanya true.
   */
  async getChecklist(tenantId: string): Promise<ChecklistResponseDto> {
    // Jalankan kedua query secara paralel — tidak ada dependensi satu sama lain
    const [activeServiceCount, paymentProfile] = await Promise.all([
      this.prisma.service.count({
        where: { tenantId, aktif: true },
      }),
      this.prisma.paymentProfile.findUnique({
        where: { tenantId },
        select: { id: true },
      }),
    ]);

    const hasService = activeServiceCount > 0;
    const hasPaymentProfile = paymentProfile !== null;

    return {
      hasService,
      hasPaymentProfile,
      isReady: hasService && hasPaymentProfile,
    };
  }
}
