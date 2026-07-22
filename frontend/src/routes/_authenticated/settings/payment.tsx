import { createFileRoute } from '@tanstack/react-router'
import { SettingsPayment } from '@/features/settings/payment'

export const Route = createFileRoute('/_authenticated/settings/payment')({
  component: SettingsPayment,
})
