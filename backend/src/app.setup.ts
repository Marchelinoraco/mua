import type { INestApplication } from '@nestjs/common';
import type { Application } from 'express';

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

  // H-1: percaya header X-Forwarded-For dari 1 hop proxy (Vercel) — tanpa ini
  // ThrottlerGuard akan menghitung SEMUA request sebagai satu IP (IP proxy),
  // sehingga rate-limit per-klien tidak efektif. `1` = percayai satu proxy
  // terdekat (bukan seluruh rantai) untuk menghindari IP-spoofing via header.
  const httpAdapter = app.getHttpAdapter().getInstance() as Application;
  httpAdapter.set('trust proxy', 1);
}
