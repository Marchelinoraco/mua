/**
 * Response shape untuk PaymentProfile.
 * tenantId TIDAK disertakan — tidak bocor ke response.
 * RULE-1: hanya instruksi rekening; tidak ada data dana/transaksi.
 */
export class PaymentProfileResponseDto {
  id: string;
  namaBank: string;
  nomorRekening: string;
  namaPemilik: string;
  instruksiTambahan: string | null;
  updatedAt: Date;
}
