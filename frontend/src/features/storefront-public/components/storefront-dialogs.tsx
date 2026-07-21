import type {
  StorefrontCustomField,
  StorefrontService,
  StorefrontTransport,
} from '../data/types'
import { StorefrontBookingDialog } from './storefront-booking-dialog'
import { useStorefrontDialogs } from './storefront-provider'
import { StorefrontReportDialog } from './storefront-report-dialog'

type StorefrontDialogsProps = {
  slug: string
  services: StorefrontService[]
  transport: StorefrontTransport | null
  customFields: StorefrontCustomField[]
}

/** Koordinator dialog storefront publik (report + booking mandiri F04). */
export function StorefrontDialogs({
  slug,
  services,
  transport,
  customFields,
}: StorefrontDialogsProps) {
  const { open, setOpen } = useStorefrontDialogs()

  return (
    <>
      <StorefrontReportDialog
        slug={slug}
        open={open === 'report'}
        onOpenChange={(state) => setOpen(state ? 'report' : null)}
      />
      <StorefrontBookingDialog
        slug={slug}
        services={services}
        transport={transport}
        customFields={customFields}
        open={open === 'booking'}
        onOpenChange={(state) => setOpen(state ? 'booking' : null)}
      />
    </>
  )
}
