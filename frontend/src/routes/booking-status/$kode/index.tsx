import { createFileRoute } from '@tanstack/react-router'
import { BookingStatusPage } from '@/features/booking-status'

export const Route = createFileRoute('/booking-status/$kode/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { kode } = Route.useParams()
  return <BookingStatusPage kode={kode} />
}
