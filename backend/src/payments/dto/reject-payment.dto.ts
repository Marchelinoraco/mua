import { IsString, MaxLength, MinLength } from 'class-validator';

/** DTO POST /orders/:id/payments/:paymentId/reject — alasan wajib (jejak audit F06, lihat catatanMua). */
export class RejectPaymentDto {
  @IsString()
  @MinLength(5, { message: 'Alasan tolak minimal 5 karakter.' })
  @MaxLength(500, { message: 'Alasan tolak maksimal 500 karakter.' })
  alasan: string;
}
