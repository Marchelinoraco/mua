import { DpTipe, ServiceType } from '@prisma/client';

/**
 * Response shape untuk Service.
 * tenantId TIDAK disertakan — tidak bocor ke response.
 * harga/dpNilai dikonversi eksplisit ke number (Prisma Decimal → number).
 */
export class ServiceResponseDto {
  id: string;
  nama: string;
  deskripsi: string | null;
  harga: number;
  durasi: number;
  tipe: ServiceType;
  dpTipe: DpTipe;
  dpNilai: number;
  butuhTransport: boolean;
  aktif: boolean;
  urutanTampil: number;
  createdAt: Date;
  updatedAt: Date;
}
