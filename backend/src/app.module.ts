import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { HealthModule } from './health/health.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PaymentProfileModule } from './payment-profile/payment-profile.module';
import { ServicesModule } from './services/services.module';
import { TransportRulesModule } from './transport-rules/transport-rules.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    HealthModule,
    OnboardingModule,
    PaymentProfileModule,
    ServicesModule,
    TransportRulesModule,
    CustomFieldsModule,
  ],
  providers: [
    {
      // Validasi DTO global — whitelist strip properti tak dikenal
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
