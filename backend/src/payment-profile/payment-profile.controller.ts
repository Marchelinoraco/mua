import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { PaymentProfileService } from './payment-profile.service';
import { UpsertPaymentProfileDto } from './dto/upsert-payment-profile.dto';
import { PaymentProfileResponseDto } from './dto/payment-profile-response.dto';

/**
 * PaymentProfileController — instruksi rekening MUA per tenant.
 * Semua endpoint terproteksi JwtAuthGuard.
 * RULE-1: tidak ada pemrosesan dana — hanya simpan & tampilkan instruksi rekening.
 */
@Controller('payment-profile')
@UseGuards(JwtAuthGuard)
export class PaymentProfileController {
  constructor(private readonly paymentProfileService: PaymentProfileService) {}

  /** GET /payment-profile — ambil instruksi rekening tenant yang login. */
  @Get()
  getPaymentProfile(
    @CurrentTenant() tenantId: string,
  ): Promise<PaymentProfileResponseDto> {
    return this.paymentProfileService.getPaymentProfile(tenantId);
  }

  /**
   * PUT /payment-profile — upsert instruksi rekening tenant yang login.
   * Idempoten: create bila belum ada, update bila sudah ada.
   */
  @Put()
  upsertPaymentProfile(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpsertPaymentProfileDto,
  ): Promise<PaymentProfileResponseDto> {
    return this.paymentProfileService.upsertPaymentProfile(tenantId, dto);
  }
}
