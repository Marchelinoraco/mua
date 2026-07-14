import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

/**
 * StorefrontModule — halaman publik per tenant (F02): profil storefront +
 * laporan/flag. Lihat juga `slots/` (F05) yang berbagi path dasar `/s/:slug`
 * untuk endpoint ketersediaan slot.
 */
@Module({
  controllers: [StorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
