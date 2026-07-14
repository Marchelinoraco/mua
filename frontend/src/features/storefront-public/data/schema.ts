import { z } from 'zod'

// ── Form "Laporkan halaman ini" ──────────────────────────────────────────────
// Kontrak backend: POST /api/s/:slug/report { alasan (10-1000), kontak? (max 200) }

export const reportFormSchema = z.object({
  alasan: z
    .string()
    .trim()
    .min(10, 'Alasan minimal 10 karakter.')
    .max(1000, 'Alasan maksimal 1000 karakter.'),
  kontak: z
    .string()
    .trim()
    .max(200, 'Kontak maksimal 200 karakter.')
    .optional()
    .or(z.literal('')),
})

export type ReportFormInput = z.input<typeof reportFormSchema>
export type ReportFormValues = z.infer<typeof reportFormSchema>
