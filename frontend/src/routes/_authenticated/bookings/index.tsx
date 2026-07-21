import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Orders } from '@/features/orders'
import { ORDER_STATUS_VALUES } from '@/features/orders/data/data'

const ordersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(20),
  status: z.array(z.enum(ORDER_STATUS_VALUES)).optional().catch([]),
  // Filter tanggalAcara, format "YYYY-MM-DD" — lihat GET /api/orders kontrak F09.
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  q: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/bookings/')({
  validateSearch: ordersSearchSchema,
  component: Orders,
})
