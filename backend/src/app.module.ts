import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { HealthModule } from './health/health.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PaymentProfileModule } from './payment-profile/payment-profile.module';
import { ServicesModule } from './services/services.module';
import { TransportRulesModule } from './transport-rules/transport-rules.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { AvailabilityModule } from './availability/availability.module';
import { BlockedDatesModule } from './blocked-dates/blocked-dates.module';
import { SlotsModule } from './slots/slots.module';
import { StorefrontModule } from './storefront/storefront.module';
import { BookingModule } from './booking/booking.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate-limiting global (H-1): default 60 req/menit per IP.
    // Endpoint spesifik (login, register, slug-check, slots publik) pakai
    // @Throttle({...}) sendiri untuk limit lebih ketat — lihat controller
    // masing-masing. Butuh `app.set('trust proxy', 1)` (lihat app.setup.ts)
    // agar IP dari x-forwarded-for terbaca benar di belakang proxy Vercel.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
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
    AvailabilityModule,
    BlockedDatesModule,
    SlotsModule,
    StorefrontModule,
    BookingModule,
    OrdersModule,
    PaymentsModule,
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
    {
      // Rate-limiting global (H-1) — diterapkan ke semua route kecuali
      // dikecualikan eksplisit dengan @SkipThrottle().
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
