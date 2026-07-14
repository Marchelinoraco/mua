import { Module } from '@nestjs/common';
import { SlotsController } from './slots.controller';
import { CalendarController } from './calendar.controller';
import { SlotsService } from './slots.service';

/**
 * SlotsModule — slot engine F05: endpoint publik (/s/:slug/slots), dashboard
 * (/calendar), dan primitif anti-bentrok reserveSlotOrThrow (dipakai F04).
 * SlotsService diekspor supaya BookingModule (F04) bisa menginjeksinya.
 * (AVAILABILITY_SELECT diimpor langsung dari availability.service.ts sebagai
 * konstanta — tidak butuh AvailabilityModule di sini karena bukan injeksi DI.)
 */
@Module({
  controllers: [SlotsController, CalendarController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
