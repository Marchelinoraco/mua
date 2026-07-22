import { InternalServerErrorException } from '@nestjs/common';
import { put } from '@vercel/blob';
import { BlobStorageService, UploadableFile } from './blob-storage.service';

/**
 * Unit test BlobStorageService (F06) — SATU-SATUNYA titik yang menyentuh
 * SDK @vercel/blob asli. Di semua spec F06 lain (payments.service.spec.ts,
 * payments.service.integration.spec.ts) BlobStorageService di-mock habis,
 * jadi tanpa file ini perilaku sebenarnya (pathname, argumen ke put(), dan
 * pembungkusan error) TIDAK PERNAH teruji sama sekali — celah yang relevan
 * mengingat BLOB_READ_WRITE_TOKEN belum diisi di lingkungan ini sehingga
 * upload sungguhan juga belum pernah diverifikasi end-to-end (lihat catatan
 * di backend/.env.example). `put()` di-mock (bukan token asli) — test ini
 * TIDAK memanggil Vercel Blob sungguhan, murni memverifikasi logika wrapper.
 */
jest.mock('@vercel/blob', () => ({ put: jest.fn() }));

const mockPut = put as jest.MockedFunction<typeof put>;

function createFile(overrides?: Partial<UploadableFile>): UploadableFile {
  return {
    buffer: Buffer.from('fake-bytes'),
    mimetype: 'image/jpeg',
    originalname: 'bukti.jpg',
    ...overrides,
  };
}

describe('BlobStorageService.uploadBuktiTransfer', () => {
  const BOOKING_ID = 'booking-1';

  beforeEach(() => {
    mockPut.mockReset();
  });

  it('memanggil put() dengan pathname payments/{bookingId}/{uuid}{ext}, access public, addRandomSuffix false', async () => {
    mockPut.mockResolvedValue({
      url: 'https://blob.example/payments/booking-1/abc.jpg',
    } as Awaited<ReturnType<typeof put>>);
    const service = new BlobStorageService();

    const url = await service.uploadBuktiTransfer(
      BOOKING_ID,
      createFile({ mimetype: 'image/jpeg' }),
    );

    expect(mockPut).toHaveBeenCalledTimes(1);
    const [pathname, buffer, options] = mockPut.mock.calls[0];
    expect(pathname).toMatch(
      /^payments\/booking-1\/[0-9a-f-]{36}\.jpg$/,
    );
    expect(buffer).toEqual(Buffer.from('fake-bytes'));
    expect(options).toMatchObject({
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
    });
    expect(url).toBe('https://blob.example/payments/booking-1/abc.jpg');
  });

  it.each([
    ['image/jpeg', '.jpg'],
    ['image/jpg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
    ['application/pdf', '.pdf'],
  ])(
    'mime %s -> ekstensi pathname %s',
    async (mimetype, ext) => {
      mockPut.mockResolvedValue({
        url: 'https://blob.example/x',
      } as Awaited<ReturnType<typeof put>>);
      const service = new BlobStorageService();

      await service.uploadBuktiTransfer(BOOKING_ID, createFile({ mimetype }));

      const [pathname] = mockPut.mock.calls[0];
      expect(pathname.endsWith(ext)).toBe(true);
    },
  );

  it('mime tak dikenal -> pathname tanpa ekstensi (tidak melempar)', async () => {
    mockPut.mockResolvedValue({
      url: 'https://blob.example/x',
    } as Awaited<ReturnType<typeof put>>);
    const service = new BlobStorageService();

    await service.uploadBuktiTransfer(
      BOOKING_ID,
      createFile({ mimetype: 'application/octet-stream' }),
    );

    const [pathname] = mockPut.mock.calls[0];
    expect(pathname).toMatch(/^payments\/booking-1\/[0-9a-f-]{36}$/);
  });

  it('pathname menyertakan bookingId yang benar (isolasi antar booking, bukan hardcode)', async () => {
    mockPut.mockResolvedValue({
      url: 'https://blob.example/x',
    } as Awaited<ReturnType<typeof put>>);
    const service = new BlobStorageService();

    await service.uploadBuktiTransfer('booking-lain-XYZ', createFile());

    const [pathname] = mockPut.mock.calls[0];
    expect(pathname.startsWith('payments/booking-lain-XYZ/')).toBe(true);
  });

  it('put() gagal (mis. BLOB_READ_WRITE_TOKEN belum/tidak valid) -> dibungkus InternalServerErrorException, tidak leak error asli', async () => {
    mockPut.mockRejectedValue(
      new Error('Vercel Blob: No token found. Either configure `BLOB_READ_WRITE_TOKEN`...'),
    );
    const service = new BlobStorageService();

    await expect(
      service.uploadBuktiTransfer(BOOKING_ID, createFile()),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('dua panggilan berurutan menghasilkan pathname unik (UUID acak, tidak collide)', async () => {
    mockPut.mockResolvedValue({
      url: 'https://blob.example/x',
    } as Awaited<ReturnType<typeof put>>);
    const service = new BlobStorageService();

    await service.uploadBuktiTransfer(BOOKING_ID, createFile());
    await service.uploadBuktiTransfer(BOOKING_ID, createFile());

    const [pathnameA] = mockPut.mock.calls[0];
    const [pathnameB] = mockPut.mock.calls[1];
    expect(pathnameA).not.toBe(pathnameB);
  });
});
