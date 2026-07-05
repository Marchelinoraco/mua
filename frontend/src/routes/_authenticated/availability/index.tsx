import { createFileRoute } from '@tanstack/react-router'

function AvailabilityPage() {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold'>Ketersediaan</h1>
      <p className='text-muted-foreground mt-2'>Segera hadir.</p>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/availability/')({
  component: AvailabilityPage,
})
