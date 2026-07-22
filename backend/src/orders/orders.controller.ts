import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { OrdersService } from './orders.service';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { RescheduleOrderDto } from './dto/reschedule-order.dto';
import {
  OrderDetailResponseDto,
  OrderListResponseDto,
} from './dto/order-response.dto';

/**
 * OrdersController — dashboard manajemen order (F09). Prefix /orders (bukan
 * /bookings) — lihat catatan arsitektur di orders.module.ts. Semua endpoint
 * terproteksi JwtAuthGuard & tenant-scoped via @CurrentTenant().
 */
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** GET /orders?status=&from=&to=&q=&page=&limit= — daftar order. */
  @Get()
  list(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<OrderListResponseDto> {
    return this.ordersService.list(tenantId, {
      status,
      from,
      to,
      q,
      page,
      limit,
    });
  }

  /** GET /orders/:id — detail order lengkap. */
  @Get(':id')
  detail(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.detail(tenantId, id);
  }

  /** POST /orders/:id/complete — tandai selesai. */
  @Post(':id/complete')
  complete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.complete(tenantId, id);
  }

  /** POST /orders/:id/cancel — batalkan + alasan. */
  @Post(':id/cancel')
  cancel(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.cancel(tenantId, id, dto);
  }

  /** POST /orders/:id/reschedule — pindah tanggal/jam, wajib lolos anti-bentrok. */
  @Post(':id/reschedule')
  reschedule(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleOrderDto,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.reschedule(tenantId, id, dto);
  }
}
