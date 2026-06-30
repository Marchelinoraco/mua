import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { cn, getPageNumbers } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type DataTablePaginationProps<TData> = {
  table: Table<TData>
  className?: string
  disabled?: boolean
  /** Optional total row count label shown on the left side. */
  totalLabel?: string
}

export function DataTablePagination<TData>({
  table,
  className,
  disabled,
  totalLabel,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation()
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 px-2',
        className
      )}
    >
      {/* Left: total + rows per page */}
      <div className='flex items-center gap-4'>
        {totalLabel && (
          <span className='text-sm font-medium text-muted-foreground'>{totalLabel}</span>
        )}
        <div className='flex items-center gap-2'>
          <p className='text-sm text-muted-foreground'>{t('dataTable.rowsPerPage')}</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
            disabled={disabled}
          >
            <SelectTrigger className='h-8 w-17.5'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: page info + navigation */}
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>
          {t('dataTable.pageOf', { current: currentPage, total: totalPages })}
        </span>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            className='size-8 p-0'
            onClick={() => table.setPageIndex(0)}
            disabled={disabled || !table.getCanPreviousPage()}
          >
            <span className='sr-only'>{t('dataTable.goToFirstPage')}</span>
            <DoubleArrowLeftIcon className='size-3.5' />
          </Button>
          <Button
            variant='outline'
            className='size-8 p-0'
            onClick={() => table.previousPage()}
            disabled={disabled || !table.getCanPreviousPage()}
          >
            <span className='sr-only'>{t('dataTable.goToPreviousPage')}</span>
            <ChevronLeftIcon className='size-3.5' />
          </Button>

          {pageNumbers.map((pageNumber, index) =>
            pageNumber === '...' ? (
              <span key={`ellipsis-${index}`} className='px-1 text-sm text-muted-foreground'>
                …
              </span>
            ) : (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? 'default' : 'outline'}
                className='size-8 p-0 text-xs'
                onClick={() => table.setPageIndex((pageNumber as number) - 1)}
                disabled={disabled}
              >
                {pageNumber}
              </Button>
            )
          )}

          <Button
            variant='outline'
            className='size-8 p-0'
            onClick={() => table.nextPage()}
            disabled={disabled || !table.getCanNextPage()}
          >
            <span className='sr-only'>{t('dataTable.goToNextPage')}</span>
            <ChevronRightIcon className='size-3.5' />
          </Button>
          <Button
            variant='outline'
            className='size-8 p-0'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={disabled || !table.getCanNextPage()}
          >
            <span className='sr-only'>{t('dataTable.goToLastPage')}</span>
            <DoubleArrowRightIcon className='size-3.5' />
          </Button>
        </div>
      </div>
    </div>
  )
}
