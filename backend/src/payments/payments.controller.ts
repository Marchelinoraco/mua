import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { OrderDetailResponseDto } from '../orders/dto/order-response.dto';
import { PaymentsService } from './payments.service';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { MarkCashPaymentDto } from './dto/mark-cash-payment.dto';

/**
 * PaymentsController — dashboard konfirmasi/tolak/tandai-tunai pembayaran
 * (F06). Prefix `orders/:id/payments` (bukan modul OrdersController
 * langsung) — dipisah controller/modul karena PaymentsService butuh
 * dependensi tambahan (BlobStorageService) yang tidak relevan untuk
 * OrdersModule; pola pemisahan sama dengan ClientsController vs
 * OrdersController yang dibundel per domain, bukan per prefix rute.
 * Semua endpoint terproteksi JwtAuthGuard & tenant-scoped via @CurrentTenant().
 */
@Controller('orders/:id/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** POST /orders/:id/payments/mark-cash — catat pembayaran tunai tanpa bukti (FR-F06-7). */
  @Post('mark-cash')
  markCash(
    @CurrentTenant() tenantId: string,
    @Param('id') bookingId: string,
    @Body() dto: MarkCashPaymentDto,
  ): Promise<OrderDetailResponseDto> {
    return this.paymentsService.markCash(tenantId, bookingId, dto);
  }

  /** POST /orders/:id/payments/:paymentId/confirm — konfirmasi bukti transfer. */
  @Post(':paymentId/confirm')
  confirm(
    @CurrentTenant() tenantId: string,
    @Param('id') bookingId: string,
    @Param('paymentId') paymentId: string,
  ): Promise<OrderDetailResponseDto> {
    return this.paymentsService.confirmPayment(tenantId, bookingId, paymentId);
  }

  /** POST /orders/:id/payments/:paymentId/reject — tolak bukti transfer + alasan. */
  @Post(':paymentId/reject')
  reject(
    @CurrentTenant() tenantId: string,
    @Param('id') bookingId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: RejectPaymentDto,
  ): Promise<OrderDetailResponseDto> {
    return this.paymentsService.rejectPayment(
      tenantId,
      bookingId,
      paymentId,
      dto,
    );
  }
}
