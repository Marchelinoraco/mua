import { StorefrontBookingDialog } from './storefront-booking-dialog'
import { useStorefrontDialogs } from './storefront-provider'
import { StorefrontReportDialog } from './storefront-report-dialog'

type StorefrontDialogsProps = {
  slug: string
}

/** Koordinator dialog storefront publik (report + booking placeholder). */
export function StorefrontDialogs({ slug }: StorefrontDialogsProps) {
  const { open, setOpen } = useStorefrontDialogs()

  return (
    <>
      <StorefrontReportDialog
        slug={slug}
        open={open === 'report'}
        onOpenChange={(state) => setOpen(state ? 'report' : null)}
      />
      <StorefrontBookingDialog
        open={open === 'booking'}
        onOpenChange={(state) => setOpen(state ? 'booking' : null)}
      />
    </>
  )
}
