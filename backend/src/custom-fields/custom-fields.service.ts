import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { CustomFieldResponseDto } from './dto/custom-field-response.dto';

const CUSTOM_FIELD_SELECT = {
  id: true,
  label: true,
  tipe: true,
  opsi: true,
  wajib: true,
  urutan: true,
} satisfies Prisma.CustomFieldSelect;

type CustomFieldRow = Prisma.CustomFieldGetPayload<{
  select: typeof CUSTOM_FIELD_SELECT;
}>;

/**
 * CustomFieldsService — pertanyaan booking kustom per tenant (F03).
 * Semua query WAJIB difilter tenantId.
 * Berbeda dengan Service, CustomField BOLEH dihapus (hard delete) selama
 * belum direferensikan oleh CustomFieldValue booking historis.
 */
@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /custom-fields — list, urut urutan asc. */
  async listCustomFields(tenantId: string): Promise<CustomFieldResponseDto[]> {
    const fields = await this.prisma.customField.findMany({
      where: { tenantId },
      orderBy: { urutan: 'asc' },
      select: CUSTOM_FIELD_SELECT,
    });

    return fields.map((field) => this.toResponseDto(field));
  }

  /** POST /custom-fields — buat custom field baru milik tenant yang login. */
  async createCustomField(
    tenantId: string,
    dto: CreateCustomFieldDto,
  ): Promise<CustomFieldResponseDto> {
    this.assertOpsiValid(dto.tipe, dto.opsi);

    const field = await this.prisma.customField.create({
      data: {
        tenantId,
        label: dto.label,
        tipe: dto.tipe,
        opsi: dto.tipe === 'select' ? (dto.opsi as Prisma.InputJsonValue) : Prisma.JsonNull,
        wajib: dto.wajib ?? false,
        urutan: dto.urutan ?? 0,
      },
      select: CUSTOM_FIELD_SELECT,
    });

    return this.toResponseDto(field);
  }

  /**
   * PUT /custom-fields/:id — update partial, tenant-scoped.
   * Validasi "opsi wajib jika tipe=select" digabung dengan data lama karena
   * tipe & opsi bisa dikirim di request terpisah.
   */
  async updateCustomField(
    tenantId: string,
    id: string,
    dto: UpdateCustomFieldDto,
  ): Promise<CustomFieldResponseDto> {
    const existing = await this.findOwnedOrThrow(tenantId, id);

    const effectiveTipe = dto.tipe ?? existing.tipe;
    const effectiveOpsi =
      dto.opsi ?? (existing.opsi as string[] | null) ?? undefined;
    this.assertOpsiValid(effectiveTipe, effectiveOpsi);

    const field = await this.prisma.customField.update({
      where: { id: existing.id },
      data: {
        label: dto.label,
        tipe: dto.tipe,
        opsi:
          effectiveTipe === 'select'
            ? (effectiveOpsi as Prisma.InputJsonValue)
            : dto.tipe !== undefined
              ? Prisma.JsonNull
              : undefined,
        wajib: dto.wajib,
        urutan: dto.urutan,
      },
      select: CUSTOM_FIELD_SELECT,
    });

    return this.toResponseDto(field);
  }

  /**
   * DELETE /custom-fields/:id — hard delete, tenant-scoped.
   * Jika masih direferensikan CustomFieldValue booking historis, Prisma
   * melempar P2003 (FK constraint) → 409 Conflict.
   */
  async deleteCustomField(tenantId: string, id: string): Promise<void> {
    await this.findOwnedOrThrow(tenantId, id);

    try {
      await this.prisma.customField.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Custom field masih dipakai booking, tidak bisa dihapus.',
        );
      }
      throw error;
    }
  }

  private async findOwnedOrThrow(
    tenantId: string,
    id: string,
  ): Promise<CustomFieldRow> {
    const field = await this.prisma.customField.findFirst({
      where: { id, tenantId },
      select: CUSTOM_FIELD_SELECT,
    });
    if (!field) {
      throw new NotFoundException('Custom field tidak ditemukan.');
    }
    return field;
  }

  /** opsi wajib array non-kosong jika tipe efektif = select. */
  private assertOpsiValid(tipe: string, opsi?: string[]): void {
    if (tipe === 'select' && (!opsi || opsi.length === 0)) {
      throw new BadRequestException(
        'opsi wajib diisi (minimal 1 item) jika tipe=select.',
      );
    }
  }

  private toResponseDto(field: CustomFieldRow): CustomFieldResponseDto {
    return {
      id: field.id,
      label: field.label,
      tipe: field.tipe,
      opsi: (field.opsi as string[] | null) ?? null,
      wajib: field.wajib,
      urutan: field.urutan,
    };
  }
}
