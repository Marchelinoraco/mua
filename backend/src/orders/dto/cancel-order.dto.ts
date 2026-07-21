import { IsString, MaxLength, MinLength } from 'class-validator';

/** DTO POST /orders/:id/cancel — alasan wajib (juga berfungsi sebagai catatan refund manual, RULE-1). */
export class CancelOrderDto {
  @IsString()
  @MinLength(5, { message: 'Alasan pembatalan minimal 5 karakter.' })
  @MaxLength(500, { message: 'Alasan pembatalan maksimal 500 karakter.' })
  alasan: string;
}
