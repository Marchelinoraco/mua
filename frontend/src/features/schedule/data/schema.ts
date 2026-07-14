import { z } from 'zod'
import { hhmmKeMenit } from '@/lib/time'

// ── Availability (Jam Kerja) ─────────────────────────────────────────────────

const hhmmSchema = z
  .string()
  .refine((value) => hhmmKeMenit(value) !== null, {
    message: 'Format jam tidak valid.',
  })

/** Satu baris per hari di editor 7 hari. `aktif=false` = hari tidak dikirim ke BE. */
export const availabilityDayFormSchema = z
  .object({
    hari: z.number().int().min(0).max(6),
    aktif: z.boolean(),
    jamMulai: hhmmSchema,
    jamSelesai: hhmmSchema,
    slotDurasi: z.coerce
      .number({ error: 'Slot durasi wajib diisi.' })
      .int('Slot durasi harus bilangan bulat.')
      .min(1, 'Slot durasi minimal 1 menit.'),
    kapasitas: z.coerce
      .number({ error: 'Kapasitas wajib diisi.' })
      .int('Kapasitas harus bilangan bulat.')
      .min(1, 'Kapasitas minimal 1.'),
  })
  .superRefine((data, ctx) => {
    if (!data.aktif) return

    const mulai = hhmmKeMenit(data.jamMulai)
    const selesai = hhmmKeMenit(data.jamSelesai)
    if (mulai === null || selesai === null) return

    if (mulai >= selesai) {
      ctx.addIssue({
        code: 'custom',
        message: 'Jam mulai harus sebelum jam selesai.',
        path: ['jamSelesai'],
      })
      return
    }

    if (selesai - mulai < data.slotDurasi) {
      ctx.addIssue({
        code: 'custom',
        message: 'Rentang jam kerja harus muat minimal satu slot durasi.',
        path: ['slotDurasi'],
      })
    }
  })

export const availabilityFormSchema = z.object({
  days: z.array(availabilityDayFormSchema).length(7),
})

export type AvailabilityDayFormInput = z.input<typeof availabilityDayFormSchema>
export type AvailabilityFormInput = z.input<typeof availabilityFormSchema>
export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>

// ── Blocked Date (Tanggal Diblokir) ──────────────────────────────────────────

export const blockedDateFormSchema = z
  .object({
    // Opsional di level tipe agar form bisa mulai dari state kosong (belum
    // memilih tanggal) — kewajiban diisi ditegakkan lewat superRefine di bawah.
    tanggalMulai: z.date().optional(),
    rentang: z.boolean(),
    tanggalSelesai: z.date().optional(),
    alasan: z.string().trim().max(255, 'Alasan maksimal 255 karakter.').optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.tanggalMulai) {
      ctx.addIssue({
        code: 'custom',
        message: 'Tanggal wajib diisi.',
        path: ['tanggalMulai'],
      })
      return
    }
    if (data.rentang) {
      if (!data.tanggalSelesai) {
        ctx.addIssue({
          code: 'custom',
          message: 'Tanggal selesai wajib diisi untuk rentang tanggal.',
          path: ['tanggalSelesai'],
        })
        return
      }
      if (data.tanggalSelesai < data.tanggalMulai) {
        ctx.addIssue({
          code: 'custom',
          message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
          path: ['tanggalSelesai'],
        })
      }
    }
  })

export type BlockedDateFormInput = z.input<typeof blockedDateFormSchema>
export type BlockedDateFormValues = z.infer<typeof blockedDateFormSchema>
