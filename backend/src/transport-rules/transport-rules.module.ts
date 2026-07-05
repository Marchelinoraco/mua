import { Module } from '@nestjs/common';
import { TransportRulesController } from './transport-rules.controller';
import { TransportRulesService } from './transport-rules.service';

@Module({
  controllers: [TransportRulesController],
  providers: [TransportRulesService],
})
export class TransportRulesModule {}
