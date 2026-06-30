import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = {
  columnCount?: number
  rowCount?: number
  showToolbar?: boolean
  showPagination?: boolean
  className?: string
}

export function DataTableSkeleton({
  columnCount = 5,
  rowCount = 5,
  showToolbar = true,
  showPagination = true,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-1 flex-col gap-4', className)}>
      {showToolbar && (
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-37.5 lg:w-62.5' />
          <Skeleton className='h-8 w-20' />
        </div>
      )}

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className='h-4 w-20' />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, r) => (
              <TableRow key={r}>
                {Array.from({ length: columnCount }).map((_, c) => (
                  <TableCell key={c}>
                    <Skeleton className={cn('h-4', c === 0 ? 'w-32' : 'w-20')} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <div className='flex items-center justify-between px-2'>
          <Skeleton className='h-8 w-24' />
          <div className='flex items-center gap-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='size-8' />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
