import { createFileRoute } from '@tanstack/react-router'

function BookingsPage() {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold'>Booking &amp; Order</h1>
      <p className='text-muted-foreground mt-2'>Segera hadir.</p>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/bookings/')({
  component: BookingsPage,
})
