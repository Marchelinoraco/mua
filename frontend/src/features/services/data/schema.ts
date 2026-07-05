import { z } from 'zod'

// ── Service ─────────────────────────────────────────────────────────────────

export const serviceTipeSchema = z.enum(['MAKEUP', 'HAIR', 'NAIL', 'OTHER'])

export const dpTipeSchema = z.enum(['PERSEN', 'NOMINAL'])

export const serviceFormSchema = z
  .object({
    nama: z.string().trim().min(1, 'Nama layanan wajib diisi.'),
    deskripsi: z.string().trim().optional(),
    harga: z.coerce
      .number({ error: 'Harga wajib diisi.' })
      .min(0, 'Harga tidak boleh negatif.'),
    durasi: z.coerce
      .number({ error: 'Durasi wajib diisi.' })
      .int('Durasi harus berupa bilangan bulat.')
      .min(1, 'Durasi minimal 1 menit.'),
    tipe: serviceTipeSchema,
    dpTipe: dpTipeSchema,
    dpNilai: z.coerce
      .number({ error: 'Nilai DP wajib diisi.' })
      .min(0, 'Nilai DP tidak boleh negatif.'),
    butuhTransport: z.boolean(),
    urutanTampil: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => (data.dpTipe === 'PERSEN' ? data.dpNilai <= 100 : true), {
    message: 'DP persen maksimal 100%.',
    path: ['dpNilai'],
  })

// `z.coerce.number()` accepts `unknown` as input (so HTML `<input type="number">`
// string values coerce cleanly) but outputs `number` — RHF's `useForm` needs both
// shapes: the raw `Input` type for `defaultValues`/field bindings, and the
// coerced `Values` (output) type for `onSubmit`/mutation payloads.
export type ServiceFormInput = z.input<typeof serviceFormSchema>
export type ServiceFormValues = z.infer<typeof serviceFormSchema>

// ── TransportRule ───────────────────────────────────────────────────────────

export const transportModeSchema = z.enum(['FLAT', 'ZONA'])

export const transportZoneFormSchema = z.object({
  nama: z.string().trim().min(1, 'Nama zona wajib diisi.'),
  nominal: z.coerce
    .number({ error: 'Nominal wajib diisi.' })
    .min(0, 'Nominal tidak boleh negatif.'),
})

export const transportRuleFormSchema = z
  .object({
    mode: transportModeSchema,
    flatNominal: z.coerce.number().min(0).nullable().optional(),
    zona: z.array(transportZoneFormSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.mode === 'FLAT' &&
      (data.flatNominal === null || data.flatNominal === undefined)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nominal transport flat wajib diisi.',
        path: ['flatNominal'],
      })
    }
    if (data.mode === 'ZONA' && (!data.zona || data.zona.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Minimal satu zona transport wajib diisi.',
        path: ['zona'],
      })
    }
  })

export type TransportRuleFormInput = z.input<typeof transportRuleFormSchema>
export type TransportRuleFormValues = z.infer<typeof transportRuleFormSchema>

// ── CustomField ─────────────────────────────────────────────────────────────

export const customFieldTipeSchema = z.enum([
  'text',
  'select',
  'checkbox',
  'date',
  'file',
])

export const customFieldFormSchema = z
  .object({
    label: z.string().trim().min(1, 'Label wajib diisi.'),
    tipe: customFieldTipeSchema,
    opsi: z
      .array(z.string().trim().min(1, 'Opsi tidak boleh kosong.'))
      .optional(),
    wajib: z.boolean(),
    urutan: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipe === 'select' && (!data.opsi || data.opsi.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Minimal satu opsi wajib diisi untuk tipe pilihan.',
        path: ['opsi'],
      })
    }
  })

export type CustomFieldFormInput = z.input<typeof customFieldFormSchema>
export type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>
