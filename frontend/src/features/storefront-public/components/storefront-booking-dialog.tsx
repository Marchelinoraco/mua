import { useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  buildBookingDetailsFormSchema,
  buildDefaultCustomValues,
  type BookingDetailsFormInput,
  type BookingDetailsFormValues,
} from '../data/schema'
import type {
  CreateBookingPayload,
  CreateBookingResponse,
  StorefrontCustomField,
  StorefrontService,
  StorefrontTransport,
} from '../data/types'
import {
  getBookingErrorMessage,
  isBookingConflictError,
  isBookingNotFoundError,
  isBookingThrottleError,
  useCreateBooking,
} from '../hooks/use-create-booking'
import { computeBookingEstimate } from '../lib/booking-pricing'
import {
  buildCustomValuesPayload,
  sortCustomFields,
} from '../lib/custom-fields'
import { toApiDateString } from '../lib/slot-date'
import { StorefrontBookingStepDetails } from './storefront-booking-step-details'
import { StorefrontBookingStepSchedule } from './storefront-booking-step-schedule'
import { StorefrontBookingStepServices } from './storefront-booking-step-services'
import { StorefrontBookingStepSummary } from './storefront-booking-step-summary'
import { StorefrontBookingSuccess } from './storefront-booking-success'

type StorefrontBookingDialogProps = {
  slug: string
  services: StorefrontService[]
  transport: StorefrontTransport | null
  customFields: StorefrontCustomField[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2 | 3 | 4

const TOTAL_STEPS = 4

/**
 * Form booking mandiri (F04), multi-step di dalam satu Sheet mobile-first.
 * Menggantikan placeholder "booking online segera hadir" — dipicu dari
 * tombol CTA yang sama (`storefront-cta.tsx`), tanpa mengubah mekanisme
 * trigger dialog (`useStorefrontDialogs`).
 *
 * Wrapper tipis ini HANYA memegang `Sheet` (supaya animasi buka/tutup Radix
 * tetap mulus) + kunci remount `wizardKey`. Seluruh state wizard (step,
 * pilihan layanan, form, dsb.) hidup di `StorefrontBookingWizard` di bawah,
 * yang di-remount penuh tiap dialog dibuka — ini SENGAJA menggantikan pola
 * "reset state via useEffect(() => {...}, [open])" (lihat React docs:
 * "Resetting all state when a prop changes") supaya tidak melanggar
 * `react-hooks/set-state-in-effect`.
 */
export function StorefrontBookingDialog({
  slug,
  services,
  transport,
  customFields,
  open,
  onOpenChange,
}: StorefrontBookingDialogProps) {
  const [wizardKey, setWizardKey] = useState(0)
  const [prevOpen, setPrevOpen] = useState(open)
  const [busy, setBusy] = useState(false)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setWizardKey((k) => k + 1)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(state) => {
        if (!busy) onOpenChange(state)
      }}
    >
      <SheetContent
        side='bottom'
        className='flex h-[92vh] flex-col gap-0 rounded-t-2xl p-0 sm:mx-auto sm:max-w-xl'
      >
        <StorefrontBookingWizard
          key={wizardKey}
          slug={slug}
          services={services}
          transport={transport}
          customFields={customFields}
          onBusyChange={setBusy}
        />
      </SheetContent>
    </Sheet>
  )
}

type StorefrontBookingWizardProps = {
  slug: string
  services: StorefrontService[]
  transport: StorefrontTransport | null
  customFields: StorefrontCustomField[]
  onBusyChange: (busy: boolean) => void
}

function StorefrontBookingWizard({
  slug,
  services,
  transport,
  customFields,
  onBusyChange,
}: StorefrontBookingWizardProps) {
  const { t } = useTranslation(['storefront', 'common'])
  const queryClient = useQueryClient()
  const createBooking = useCreateBooking(slug)

  const [step, setStep] = useState<Step>(1)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [zonaNama, setZonaNama] = useState<string | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [jamMulai, setJamMulai] = useState<number | undefined>(undefined)
  const [successData, setSuccessData] = useState<CreateBookingResponse | null>(
    null
  )

  // `sortCustomFields`/schema/defaultValues dihitung sekali per mount — cukup
  // krn `StorefrontBookingWizard` di-remount penuh tiap Sheet dibuka (lihat
  // catatan `wizardKey` di komponen pembungkus), jadi tidak perlu `form.reset`
  // reaktif saat `customFields` berubah (referensinya statis dalam 1 mount).
  const sortedCustomFields = useMemo(
    () => sortCustomFields(customFields),
    [customFields]
  )

  const detailsForm = useForm<
    BookingDetailsFormInput,
    unknown,
    BookingDetailsFormValues
  >({
    // Cast diperlukan krn skema dibangun dinamis per tenant (`customFields`
    // berbeda-beda) — bentuknya TIDAK bisa diketahui TypeScript saat compile
    // time, tapi SELALU menghasilkan `customValues: Record<string, string>`
    // sesuai kontrak yang didokumentasikan di `data/schema.ts`.
    resolver: zodResolver(
      buildBookingDetailsFormSchema(sortedCustomFields)
    ) as Resolver<BookingDetailsFormInput, unknown, BookingDetailsFormValues>,
    defaultValues: {
      nama: '',
      phone: '',
      email: '',
      lokasiAcara: '',
      catatan: '',
      customValues: buildDefaultCustomValues(sortedCustomFields),
    },
  })

  const estimate = useMemo(
    () =>
      computeBookingEstimate(services, selectedServiceIds, transport, zonaNama),
    [services, selectedServiceIds, transport, zonaNama]
  )

  const zonaRequired =
    estimate.requiresTransport &&
    transport?.mode === 'ZONA' &&
    (transport.zona?.length ?? 0) > 0 &&
    !zonaNama

  const canProceedStep1 = selectedServiceIds.length > 0 && !zonaRequired
  const canProceedStep2 = selectedDate !== undefined && jamMulai !== undefined

  function handleSelectDate(date: Date | undefined) {
    setSelectedDate(date)
    setJamMulai(undefined)
  }

  function handleToggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleNext() {
    if (step === 1 && canProceedStep1) {
      setStep(2)
      return
    }
    if (step === 2 && canProceedStep2) {
      setStep(3)
      return
    }
    if (step === 3) {
      const valid = await detailsForm.trigger()
      if (valid) setStep(4)
    }
  }

  function handleBack() {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev))
  }

  function handleSubmit() {
    if (!selectedDate || jamMulai === undefined) return
    const values = detailsForm.getValues()
    const customValues = buildCustomValuesPayload(
      sortedCustomFields,
      values.customValues
    )
    const payload: CreateBookingPayload = {
      serviceIds: selectedServiceIds,
      tanggalAcara: toApiDateString(selectedDate),
      jamMulai,
      lokasiAcara: values.lokasiAcara ? values.lokasiAcara : undefined,
      zonaNama:
        estimate.requiresTransport && transport?.mode === 'ZONA'
          ? zonaNama
          : undefined,
      catatan: values.catatan ? values.catatan : undefined,
      client: {
        nama: values.nama,
        phone: values.phone,
        email: values.email ? values.email : undefined,
      },
      customValues: customValues.length > 0 ? customValues : undefined,
    }

    onBusyChange(true)
    createBooking.mutate(payload, {
      onSuccess: (response) => {
        onBusyChange(false)
        setSuccessData(response)
      },
      onError: (error) => {
        onBusyChange(false)
        if (isBookingConflictError(error)) {
          toast.error(
            getBookingErrorMessage(error, t('booking.errors.conflict'))
          )
          setJamMulai(undefined)
          queryClient.invalidateQueries({
            queryKey: ['storefront-public', slug, 'slots'],
          })
          setStep(2)
          return
        }
        if (isBookingThrottleError(error)) {
          toast.error(t('booking.errors.throttle'))
          return
        }
        if (isBookingNotFoundError(error)) {
          toast.error(t('booking.errors.notFound'))
          return
        }
        toast.error(getBookingErrorMessage(error, t('booking.errors.generic')))
      },
    })
  }

  if (successData) {
    return (
      <div className='flex-1 overflow-y-auto p-4'>
        <StorefrontBookingSuccess data={successData} />
      </div>
    )
  }

  const stepTitles: Record<Step, string> = {
    1: t('booking.steps.services'),
    2: t('booking.steps.schedule'),
    3: t('booking.steps.details'),
    4: t('booking.steps.summary'),
  }

  return (
    <>
      <SheetHeader className='space-y-3 text-start'>
        <div>
          <SheetTitle>{stepTitles[step]}</SheetTitle>
          <SheetDescription>
            {t('booking.stepIndicator', {
              current: step,
              total: TOTAL_STEPS,
            })}
          </SheetDescription>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} />
      </SheetHeader>

      <div className='flex-1 overflow-y-auto px-4 pb-4'>
        {step === 1 && (
          <StorefrontBookingStepServices
            services={services}
            transport={transport}
            selectedServiceIds={selectedServiceIds}
            onToggleService={handleToggleService}
            zonaNama={zonaNama}
            onZonaChange={setZonaNama}
            estimate={estimate}
            zonaRequired={zonaRequired}
          />
        )}
        {step === 2 && (
          <StorefrontBookingStepSchedule
            slug={slug}
            durasiTotal={estimate.durasiTotal}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            jamMulai={jamMulai}
            onSelectSlot={setJamMulai}
          />
        )}
        {step === 3 && (
          <Form {...detailsForm}>
            <StorefrontBookingStepDetails
              form={detailsForm}
              customFields={sortedCustomFields}
            />
          </Form>
        )}
        {step === 4 && (
          <StorefrontBookingStepSummary
            estimate={estimate}
            selectedDate={selectedDate}
            jamMulai={jamMulai}
            zonaNama={
              estimate.requiresTransport && transport?.mode === 'ZONA'
                ? zonaNama
                : undefined
            }
            details={detailsForm.getValues()}
            customFields={sortedCustomFields}
          />
        )}
      </div>

      <SheetFooter className='flex-row gap-2 border-t'>
        <Button
          type='button'
          variant='outline'
          className='flex-1'
          onClick={handleBack}
          disabled={step === 1 || createBooking.isPending}
        >
          {t('common:back')}
        </Button>
        {step < TOTAL_STEPS ? (
          <Button
            type='button'
            className='flex-1'
            onClick={handleNext}
            disabled={
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !canProceedStep2)
            }
          >
            {t('common:next')}
          </Button>
        ) : (
          <Button
            type='button'
            className='flex-1'
            onClick={handleSubmit}
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? (
              <>
                <Loader2 className='animate-spin' />
                {t('booking.summaryStep.submitting')}
              </>
            ) : (
              t('booking.summaryStep.submit')
            )}
          </Button>
        )}
      </SheetFooter>
    </>
  )
}
