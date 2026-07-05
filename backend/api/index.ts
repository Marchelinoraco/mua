import type { IncomingMessage, ServerResponse } from 'http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

/**
 * Entry point Vercel Serverless Function.
 *
 * Bootstrap NestJS satu kali per lambda instance (cold start), lalu dipakai
 * ulang untuk invocation berikutnya selama instance masih "warm". Yang
 * di-cache adalah PROMISE-nya (bukan hasilnya) supaya invocation concurrent
 * saat cold start tidak memicu bootstrap ganda (race condition).
 */
const expressApp = express();

let bootstrapPromise: Promise<void> | undefined;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  configureApp(app);
  await app.init();
}

function getBootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    // Kalau bootstrap gagal, buang cache-nya supaya invocation berikutnya
    // boleh mencoba lagi (bukan stuck di promise yang sudah reject).
    bootstrapPromise = bootstrap().catch((err) => {
      bootstrapPromise = undefined;
      throw err;
    });
  }
  return bootstrapPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await getBootstrap();
  expressApp(req, res);
}
