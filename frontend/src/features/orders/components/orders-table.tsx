import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/date-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DataTableLoadingOverlay,
  DataTablePagination,
  DataTableToolbar,
} from '@/components/data-table'
import { ORDER_STATUS_OPTIONS } from '../data/data'
import type { BookingStatus } from '../data/types'
import { useOrdersList } from '../hooks/use-orders'
import { useOrdersColumns } from './orders-columns'
import { useOrders } from './orders-provider'

const route = getRouteApi('/_authenticated/bookings/')

/** Tick berkala supaya badge sisa waktu hold (AWAITING_DP) tetap hidup. */
function useNowTick(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function toApiDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function OrdersTable() {
  const { t } = useTranslation('orders')
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { setCurrentRow, setDetailOpen } = useOrders()
  const now = useNowTick(30_000)
  const columns = useOrdersColumns(now)

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const {
    columnFilters,
    onColumnFiltersChange,
    globalFilter,
    onGlobalFilterChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'q' },
    columnFilters: [{ columnId: 'status', searchKey: 'status', type: 'array' }],
  })

  const debouncedQ = useDebouncedValue(globalFilter ?? '', 300)
  const statusFilter = columnFilters.find((f) => f.id === 'status')
    ?.value as BookingStatus[] | undefined

  const from = typeof search.from === 'string' ? search.from : undefined
  const to = typeof search.to === 'string' ? search.to : undefined

  function updateDateRange(nextFrom: string | undefined, nextTo: string | undefined) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: undefined,
        from: nextFrom || undefined,
        to: nextTo || undefined,
      }),
    })
  }

  const { data, isLoading, isFetching, isError } = useOrdersList({
    status: statusFilter,
    from,
    to,
    q: debouncedQ,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  })

  const rows = data?.data ?? []
  const pageCount = data ? Math.max(1, Math.ceil(data.total / pagination.pageSize)) : 1

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
    },
    manualPagination: true,
    manualFiltering: true,
    pageCount,
    onPaginationChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    if (data) ensurePageInRange(pageCount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, pageCount])

  const isExtraFiltered = Boolean(from || to)

  function openDetail(row: (typeof rows)[number]) {
    setCurrentRow(row)
    setDetailOpen(true)
  }

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t('searchPlaceholder')}
        disabled={isLoading}
        filters={[
          {
            columnId: 'status',
            title: t('filters.status'),
            options: ORDER_STATUS_OPTIONS.map((s) => ({
              label: t(`status.${s.value}`),
              value: s.value,
            })),
          },
        ]}
        isExtraFiltered={isExtraFiltered}
        onReset={() => updateDateRange(undefined, undefined)}
        extraFilters={
          <div className='flex items-center gap-1'>
            <DatePicker
              selected={from ? toNaiveDate(from) : undefined}
              onSelect={(date) =>
                updateDateRange(date ? toApiDate(date) : undefined, to)
              }
              placeholder={t('filters.from')}
              disabled={() => false}
              className='h-8 w-32 justify-start text-start text-xs font-normal data-[empty=true]:text-muted-foreground'
            />
            <span className='text-xs text-muted-foreground'>–</span>
            <DatePicker
              selected={to ? toNaiveDate(to) : undefined}
              onSelect={(date) =>
                updateDateRange(from, date ? toApiDate(date) : undefined)
              }
              placeholder={t('filters.to')}
              disabled={() => false}
              className='h-8 w-32 justify-start text-start text-xs font-normal data-[empty=true]:text-muted-foreground'
            />
          </div>
        }
      />

      <div className='relative overflow-hidden rounded-md border'>
        <DataTableLoadingOverlay isLoading={isLoading || isFetching} />
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(header.column.columnDef.meta?.className)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center text-destructive'
                >
                  {t('loadError')}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={0}
                  role='button'
                  aria-label={t('rowAriaLabel', {
                    kode: row.original.kodeBooking,
                  })}
                  className='cursor-pointer focus-visible:bg-muted focus-visible:outline-none'
                  onClick={() => openDetail(row.original)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openDetail(row.original)
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.className)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  {t('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        className='mt-auto'
        totalLabel={data ? t('totalLabel', { count: data.total }) : undefined}
      />
    </div>
  )
}

/** `from`/`to` di URL adalah "YYYY-MM-DD" murni (bukan datetime) — parse sebagai komponen lokal, BUKAN `new Date(str)` (yang membacanya sbg UTC tengah malam dan bisa mundur satu hari di DatePicker saat ditampilkan). */
function toNaiveDate(yyyyMmDd: string): Date {
  const [year, month, day] = yyyyMmDd.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}
