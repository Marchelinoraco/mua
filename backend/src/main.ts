import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix untuk semua route API
  app.setGlobalPrefix('api');

  // CORS — sesuaikan origin di env production
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`GlowBook API berjalan di: http://localhost:${port}/api`);
}
bootstrap();
