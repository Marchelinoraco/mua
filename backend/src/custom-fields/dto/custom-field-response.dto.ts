/**
 * Response shape untuk CustomField.
 * tenantId TIDAK disertakan — tidak bocor ke response.
 */
export class CustomFieldResponseDto {
  id: string;
  label: string;
  tipe: string;
  opsi: string[] | null;
  wajib: boolean;
  urutan: number;
}
