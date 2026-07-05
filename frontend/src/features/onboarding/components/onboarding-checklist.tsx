import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import type { OnboardingChecklist } from '../data/schema'

function fetchChecklist(): Promise<OnboardingChecklist> {
  return api
    .get<OnboardingChecklist>('/onboarding/checklist')
    .then((r) => r.data)
}

export function useOnboardingChecklist() {
  return useQuery({
    queryKey: ['onboarding', 'checklist'],
    queryFn: fetchChecklist,
    staleTime: 30_000,
  })
}

export function OnboardingChecklist() {
  const { t } = useTranslation('auth')
  const { data, isLoading } = useOnboardingChecklist()

  if (isLoading) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span>Memuat status setup...</span>
      </div>
    )
  }

  if (!data) return null

  const items: { key: keyof OnboardingChecklist; label: string }[] = [
    { key: 'hasPaymentProfile', label: t('onboarding.checklist.paymentProfile') },
    { key: 'hasService', label: t('onboarding.checklist.service') },
    { key: 'hasAvailability', label: t('onboarding.checklist.availability') },
  ]

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <p className='text-sm font-medium'>
          {t('onboarding.checklist.title')}
        </p>
        {data.isReady ? (
          <Badge className='bg-green-600 text-white hover:bg-green-700'>
            {t('onboarding.checklist.readyBadge')}
          </Badge>
        ) : (
          <Badge variant='outline' className='text-muted-foreground'>
            {t('onboarding.checklist.notReady')}
          </Badge>
        )}
      </div>
      <ul className='space-y-1'>
        {items.map(({ key, label }) => (
          <li key={key} className='flex items-center gap-2 text-sm'>
            {data[key] ? (
              <CheckCircle2 className='h-4 w-4 shrink-0 text-green-600' />
            ) : (
              <Circle className='h-4 w-4 shrink-0 text-muted-foreground' />
            )}
            <span
              className={
                data[key] ? 'text-foreground' : 'text-muted-foreground'
              }
            >
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
