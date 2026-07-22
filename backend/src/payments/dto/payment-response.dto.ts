import { PaymentStatus } from '@prisma/client';

/** Response 201 POST /bookings/:kode/payments (F06, publik) — bentuk minimal, bukan detail order penuh. */
export class PaymentUploadResponseDto {
  id: string;
  tipe: string;
  jumlah: number;
  status: PaymentStatus;
  buktiFotoUrl: string | null;
  createdAt: Date;
}
