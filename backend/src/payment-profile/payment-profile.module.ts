import { Module } from '@nestjs/common';
import { PaymentProfileController } from './payment-profile.controller';
import { PaymentProfileService } from './payment-profile.service';

@Module({
  controllers: [PaymentProfileController],
  providers: [PaymentProfileService],
})
export class PaymentProfileModule {}
