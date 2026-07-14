/** Response shape untuk BlockedDate. tenantId TIDAK disertakan. */
export class BlockedDateResponseDto {
  id: string;
  tanggalMulai: Date;
  tanggalSelesai: Date;
  alasan: string | null;
  createdAt: Date;
}
