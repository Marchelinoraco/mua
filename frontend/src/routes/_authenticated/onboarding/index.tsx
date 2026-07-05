import { createFileRoute } from '@tanstack/react-router'
import { OnboardingWizard } from '@/features/onboarding'

export const Route = createFileRoute('/_authenticated/onboarding/')({
  component: OnboardingWizard,
})
