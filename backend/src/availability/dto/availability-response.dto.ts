/** Response shape untuk Availability. tenantId TIDAK disertakan. */
export class AvailabilityResponseDto {
  id: string;
  hari: number;
  jamMulai: number;
  jamSelesai: number;
  slotDurasi: number;
  kapasitas: number;
  createdAt: Date;
  updatedAt: Date;
}
