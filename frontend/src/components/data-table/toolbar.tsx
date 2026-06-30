import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DataTableFacetedFilter,
  DataTableFacetedFilterAsync,
  type DataTableFacetedFilterOption,
} from './faceted-filter'
import { DataTableViewOptions } from './view-options'

type DataTableToolbarFilter = {
  columnId: string
  title: string
  options: DataTableFacetedFilterOption[]
  singleSelect?: boolean
} & (
  | {
      async?: false
    }
  | {
      async: true
      isLoading?: boolean
      onSearch?: (query: string) => void | Promise<void>
      searchPlaceholder?: string
    }
)

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  searchPlaceholder?: string
  searchKey?: string
  disabled?: boolean
  disableSearch?: boolean
  onSearchSubmit?: (value: string) => void
  filters?: DataTableToolbarFilter[]
  /** Extra filter elements rendered after faceted filters. */
  extraFilters?: React.ReactNode
  /** Whether extra filters have active values (contributes to showing reset button). */
  isExtraFiltered?: boolean
  /** Called when reset button is clicked, in addition to clearing table filters. */
  onReset?: () => void
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  searchKey,
  filters = [],
  disabled,
  disableSearch,
  onSearchSubmit,
  extraFilters,
  isExtraFiltered,
  onReset,
}: DataTableToolbarProps<TData>) {
  const { t } = useTranslation()
  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter || isExtraFiltered
  const searchValue = searchKey
    ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? '')
    : (table.getState().globalFilter ?? '')

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        {searchKey ? (
          <Input
            placeholder={searchPlaceholder ?? t('filter')}
            value={searchValue}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              onSearchSubmit?.((event.currentTarget.value ?? '').trim())
            }}
            className='h-8 w-37.5 lg:w-62.5'
            disabled={disableSearch ?? disabled}
          />
        ) : (
          <Input
            placeholder={searchPlaceholder ?? t('filter')}
            value={searchValue}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSearchSubmit?.((event.currentTarget.value ?? '').trim())
              }
            }}
            onBlur={() => {
              onSearchSubmit?.(searchValue.trim())
            }}
            className='h-8 w-37.5 lg:w-62.5'
            disabled={disableSearch ?? disabled}
          />
        )}
        <div className='flex gap-x-2'>
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId)
            if (!column) return null
            if (filter.async) {
              return (
                <DataTableFacetedFilterAsync
                  key={filter.columnId}
                  column={column}
                  title={filter.title}
                  options={filter.options}
                  singleSelect={filter.singleSelect}
                  disabled={disabled}
                  isLoading={filter.isLoading}
                  onSearch={filter.onSearch}
                  searchPlaceholder={filter.searchPlaceholder}
                />
              )
            }
            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
                singleSelect={filter.singleSelect}
                disabled={disabled}
              />
            )
          })}
          {extraFilters}
        </div>
        {isFiltered && (
          <Button
            variant='destructive'
            size='icon'
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
              onReset?.()
            }}
            className='h-8 w-8'
            disabled={disabled}
          >
            <Cross2Icon className='h-4 w-4' />
            <span className='sr-only'>{t('reset')}</span>
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} disabled={disabled} />
    </div>
  )
}
