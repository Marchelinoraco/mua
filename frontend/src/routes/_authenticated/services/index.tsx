import { createFileRoute } from '@tanstack/react-router'

function ServicesPage() {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold'>Layanan</h1>
      <p className='text-muted-foreground mt-2'>Segera hadir.</p>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/services/')({
  component: ServicesPage,
})
