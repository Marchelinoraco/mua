import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`GlowBook API berjalan di: http://localhost:${port}/api`);
}
bootstrap();
