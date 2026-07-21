import { useEffect } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { cn } from '@/lib/utils'
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
import { useClientsList } from '../hooks/use-clients'
import { useClientsColumns } from './clients-columns'
import { useClients } from './clients-provider'

const route = getRouteApi('/_authenticated/clients/')

export function ClientsTable() {
  const { t } = useTranslation('clients')
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { setCurrentRow, setDetailOpen } = useClients()
  const columns = useClientsColumns()

  const { globalFilter, onGlobalFilterChange, pagination, onPaginationChange, ensurePageInRange } =
    useTableUrlState({
      search,
      navigate,
      pagination: { defaultPage: 1, defaultPageSize: 20 },
      globalFilter: { enabled: true, key: 'q' },
    })

  const debouncedQ = useDebouncedValue(globalFilter ?? '', 300)

  const { data, isLoading, isFetching, isError } = useClientsList({
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
    state: { globalFilter, pagination },
    manualPagination: true,
    manualFiltering: true,
    pageCount,
    onPaginationChange,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    if (data) ensurePageInRange(pageCount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, pageCount])

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
                  aria-label={t('rowAriaLabel', { nama: row.original.nama })}
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
