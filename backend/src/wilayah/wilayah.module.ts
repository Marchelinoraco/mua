import { Module } from '@nestjs/common';
import { WilayahController } from './wilayah.controller';
import { WilayahService } from './wilayah.service';

/**
 * WilayahModule — data referensi wilayah Indonesia (Province/Regency) [global].
 * Diekspor supaya modul lain (mis. Tenant) bisa validasi regencyId bila perlu.
 */
@Module({
  controllers: [WilayahController],
  providers: [WilayahService],
  exports: [WilayahService],
})
export class WilayahModule {}
