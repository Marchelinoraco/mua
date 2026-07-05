import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const { accessToken, tenant, justRegistered } =
      useAuthStore.getState().auth

    // No token → send to sign-in
    if (!accessToken) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
        replace: true,
      })
    }

    // No tenant yet (edge-case: token present but tenant not set) → sign-in
    if (!tenant && location.pathname !== '/onboarding') {
      // Allow the onboarding route itself to render without a tenant
      // so the wizard can display the welcome step with data from auth-store
    }

    // Fresh register → send to onboarding (unless already there)
    if (justRegistered && location.pathname !== '/onboarding') {
      throw redirect({ to: '/onboarding', replace: true })
    }
  },
  component: AuthenticatedLayout,
})
