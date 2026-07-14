import { Skeleton } from '@/components/ui/skeleton'

export function StorefrontSkeleton() {
  return (
    <div className='mx-auto max-w-xl'>
      <Skeleton className='h-36 w-full rounded-none sm:h-48' />
      <div className='px-4 sm:px-6'>
        <div className='-mt-10 sm:-mt-12'>
          <Skeleton className='h-20 w-20 rounded-full border-4 border-background sm:h-24 sm:w-24' />
        </div>
        <div className='mt-3 space-y-2 pb-4'>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-4 w-24' />
        </div>
      </div>
      <div className='space-y-3 px-4 sm:px-6'>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className='h-24 w-full rounded-md' />
        ))}
      </div>
    </div>
  )
}
