import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';

/** Bentuk minimal file upload yang dibutuhkan — cocok dengan Express.Multer.File (memory storage). */
export interface UploadableFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

/**
 * BlobStorageService — bungkus tipis @vercel/blob `put()` (F06, keputusan
 * arsitektur: bukti transfer disimpan di Vercel Blob, BUKAN filesystem lokal
 * — cocok untuk deploy serverless Vercel yang tidak punya disk persisten).
 *
 * RULE-1 (nol kustodi): file yang disimpan hanya BUKTI/GAMBAR transfer, BUKAN
 * dana — platform tidak pernah memegang uang, hanya jejak bukti untuk MUA
 * verifikasi manual.
 *
 * `BLOB_READ_WRITE_TOKEN`: dibaca otomatis oleh SDK @vercel/blob dari
 * process.env bila tidak dioper eksplisit (perilaku default SDK, konsisten
 * dgn deploy Vercel). SENGAJA TIDAK divalidasi lewat ConfigService.getOrThrow
 * di constructor — bila token belum dikonfigurasi (mis. dev lokal sebelum
 * provisioning), app tetap WAJIB bisa boot & endpoint lain (mark-cash,
 * confirm, reject) tetap berfungsi; hanya upload sungguhan yang akan gagal
 * (dilempar sebagai 500 di bawah) sampai token diisi di .env.
 */
@Injectable()
export class BlobStorageService {
  private readonly logger = new Logger(BlobStorageService.name);

  /** Unggah bukti transfer ke path `payments/{bookingId}/{uuid}{ext}`, kembalikan URL publik. */
  async uploadBuktiTransfer(
    bookingId: string,
    file: UploadableFile,
  ): Promise<string> {
    const ext = EXTENSION_BY_MIME[file.mimetype] ?? '';
    const pathname = `payments/${bookingId}/${randomUUID()}${ext}`;

    try {
      const blob = await put(pathname, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
        addRandomSuffix: false,
      });
      return blob.url;
    } catch (error) {
      this.logger.error(
        `Gagal mengunggah bukti transfer ke Vercel Blob (bookingId=${bookingId}).`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Gagal mengunggah bukti transfer. Coba lagi beberapa saat.',
      );
    }
  }
}
