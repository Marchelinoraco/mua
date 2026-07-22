/**
 * Deteksi apakah URL bukti transfer (F06, `Payment.buktiFotoUrl`) adalah PDF
 * atau gambar — dipakai untuk memilih preview (thumbnail gambar vs link
 * "Lihat PDF"). Backend selalu menambahkan ekstensi sesuai mimetype saat
 * upload (lihat `backend/src/payments/blob-storage.service.ts`
 * `EXTENSION_BY_MIME`), jadi cek suffix `.pdf` cukup andal — dipakai bersama
 * oleh `features/orders` (dashboard) & `features/booking-status` (publik).
 */
export function isPdfProofUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf')
}
