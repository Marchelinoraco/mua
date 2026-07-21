import { z } from 'zod'

/**
 * Form editor catatan klien — `PUT /clients/:id/notes` menerima `catatan`
 * string ATAU `null` (null = hapus catatan), maks 2000 karakter (sama
 * persis dengan backend/src/orders/dto/update-client-notes.dto.ts).
 * Textarea kosong dikirim sebagai `null` (lihat client-notes-editor.tsx).
 */
export const clientNotesFormSchema = z.object({
  catatan: z
    .string()
    .max(2000, 'Catatan maksimal 2000 karakter.')
    .optional()
    .default(''),
})

export type ClientNotesFormInput = z.input<typeof clientNotesFormSchema>
export type ClientNotesFormValues = z.infer<typeof clientNotesFormSchema>
