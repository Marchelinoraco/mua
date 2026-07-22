import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO POST /orders/:id/payments/mark-cash (F06, FR-F06-7) — MUA mencatat
 * pembayaran tunai di lokasi TANPA bukti unggahan. Payment dibuat langsung
 * berstatus CONFIRMED (lihat PaymentsService.markCash).
 */
export class MarkCashPaymentDto {
  @IsIn(['DP', 'PELUNASAN'], { message: 'tipe harus "DP" atau "PELUNASAN".' })
  tipe: 'DP' | 'PELUNASAN';

  @IsNumber({}, { message: 'jumlah harus berupa angka.' })
  @IsPositive({ message: 'jumlah harus lebih besar dari 0.' })
  jumlah: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Catatan maksimal 500 karakter.' })
  catatanMua?: string;
}
