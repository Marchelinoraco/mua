import { IsBoolean } from 'class-validator';

/** DTO untuk PATCH /services/:id — toggle aktif/nonaktif (tanpa hard delete, FR-F03-6). */
export class ToggleServiceStatusDto {
  @IsBoolean()
  aktif: boolean;
}
