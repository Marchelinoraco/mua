import { IsString, MaxLength, ValidateIf } from 'class-validator';

/**
 * DTO PUT /clients/:id/notes.
 * `catatan` WAJIB dikirim di body, tapi nilainya boleh string ATAU null
 * (null = hapus catatan). ValidateIf melewati validasi IsString/MaxLength
 * hanya ketika nilainya null; selain itu (termasuk undefined/tidak dikirim)
 * tetap divalidasi sebagai string — menegakkan field ini wajib ada di body.
 */
export class UpdateClientNotesDto {
  @ValidateIf((o: UpdateClientNotesDto) => o.catatan !== null)
  @IsString({ message: 'Catatan harus berupa teks atau null.' })
  @MaxLength(2000, { message: 'Catatan maksimal 2000 karakter.' })
  catatan: string | null;
}
