import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CalendarCheck, PartyPopper, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { OnboardingChecklist } from './components/onboarding-checklist'
import { OnboardingPaymentStep } from './components/onboarding-payment-step'

// ── Inline progress bar (Progress shadcn not installed due to TS6 peer-dep) ─

function WizardProgress({
  current,
  total,
}: {
  current: number
  total: number
}) {
  const pct = Math.round((current / total) * 100)
  return (
    <div
      role='progressbar'
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Langkah ${current} dari ${total}`}
      className='h-2 w-full overflow-hidden rounded-full bg-muted'
    >
      <div
        className='h-full rounded-full bg-primary transition-all duration-300'
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Step definitions ─────────────────────────────────────────────────────────

const TOTAL_STEPS = 3

// ── Main Wizard ──────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const { t } = useTranslation('auth')

  const tenant = auth.tenant
  const namaBisnis = tenant?.namaBisnis ?? ''

  // ── Step 1 — Selamat datang ─────────────────────────────────────────────

  function Step1() {
    return (
      <div className='space-y-6 text-center'>
        <div className='flex justify-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <PartyPopper className='h-8 w-8 text-primary' />
          </div>
        </div>
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold'>
            {t('onboarding.step1.title')}
          </h2>
          {namaBisnis && (
            <p className='text-lg font-semibold text-primary'>{namaBisnis}</p>
          )}
          <p className='text-muted-foreground'>
            {t('onboarding.step1.subtitle')}
          </p>
        </div>
        <div className='rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'>
          <div className='flex items-center justify-center gap-2'>
            <CalendarCheck className='h-4 w-4 shrink-0' />
            <span>{t('onboarding.step1.trialInfo')}</span>
          </div>
        </div>
        <Button className='w-full' onClick={() => setStep(2)}>
          {t('onboarding.step1.startButton')}
        </Button>
      </div>
    )
  }

  // ── Step 2 — PaymentProfile ─────────────────────────────────────────────

  function Step2() {
    return (
      <OnboardingPaymentStep onSuccess={() => setStep(3)} />
    )
  }

  // ── Step 3 — Layanan (stub) ─────────────────────────────────────────────

  function Step3() {
    function finish() {
      auth.setJustRegistered(false)
      void navigate({ to: '/', replace: true })
    }

    return (
      <div className='space-y-4 text-center'>
        <div className='flex justify-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <Wrench className='h-8 w-8 text-primary' />
          </div>
        </div>
        <div className='space-y-2'>
          <h2 className='text-xl font-bold'>{t('onboarding.step3.title')}</h2>
          <p className='text-muted-foreground'>
            {t('onboarding.step3.subtitle')}
          </p>
        </div>
        <div className='rounded-lg border bg-muted/40 px-4 py-4 text-sm text-muted-foreground'>
          {t('onboarding.step3.comingSoon')}
        </div>

        {/* Checklist status */}
        <div className='rounded-lg border px-4 py-4 text-start'>
          <OnboardingChecklist />
        </div>

        <Button className='w-full' onClick={finish}>
          {t('onboarding.step3.skipButton')}
        </Button>
      </div>
    )
  }

  // ── Step header labels ──────────────────────────────────────────────────

  const stepLabels: Record<number, string> = {
    1: t('onboarding.step1.title'),
    2: t('onboarding.step2.title'),
    3: t('onboarding.step3.title'),
  }

  const stepDescriptions: Record<number, string> = {
    1: '',
    2: t('onboarding.step2.subtitle'),
    3: t('onboarding.step3.subtitle'),
  }

  return (
    <div className='flex min-h-svh items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-3'>
          {/* Title + step badge */}
          <div className='flex items-start justify-between gap-2'>
            <div>
              <CardTitle className='text-lg'>{t('onboarding.title')}</CardTitle>
              {stepDescriptions[step] && (
                <CardDescription className='mt-1'>
                  {stepDescriptions[step]}
                </CardDescription>
              )}
            </div>
            <Badge variant='outline' className='shrink-0 text-xs'>
              {t('onboarding.progress', {
                current: step,
                total: TOTAL_STEPS,
              })}
            </Badge>
          </div>

          {/* Progress bar */}
          <WizardProgress current={step} total={TOTAL_STEPS} />

          {/* Step pills */}
          <div className='flex gap-1.5'>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  s < step
                    ? 'bg-primary text-primary-foreground'
                    : s === step
                      ? 'border-2 border-primary text-primary'
                      : 'border border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {s}
              </div>
            ))}
            <span className='ms-1 self-center text-xs text-muted-foreground'>
              {stepLabels[step]}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </CardContent>
      </Card>
    </div>
  )
}
