/**
 * Response publik GET /s/:slug/slots — JANGAN bocorkan detail booking/klien
 * apa pun. Hanya bentuk slot + ketersediaan.
 */
export class PublicSlotDto {
  jamMulai: number;
  jamSelesai: number;
  tersedia: boolean;
}

export class PublicSlotsResponseDto {
  date: string; // YYYY-MM-DD
  slots: PublicSlotDto[];
}
