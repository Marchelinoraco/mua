import type { INestApplication } from '@nestjs/common';

/**
 * Konfigurasi bersama untuk instance NestJS, dipakai baik oleh
 * `src/main.ts` (dev lokal, `app.listen`) maupun `api/index.ts`
 * (Vercel serverless function, `app.init` tanpa listen).
 */
export function configureApp(app: INestApplication): void {
  // Global prefix untuk semua route API
  app.setGlobalPrefix('api');

  // CORS — sesuaikan origin di env production
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });
}
