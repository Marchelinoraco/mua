import { Skeleton } from '@/components/ui/skeleton'

export function BookingStatusSkeleton() {
  return (
    <div className='mx-auto max-w-xl space-y-4 px-4 py-8 sm:px-6'>
      <Skeleton className='h-8 w-40' />
      <Skeleton className='h-24 w-full rounded-md' />
      <Skeleton className='h-40 w-full rounded-md' />
    </div>
  )
}
