import * as React from 'react'
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { type Column } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

export type DataTableFacetedFilterOption = {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

type DataTableFacetedFilterProps<TData, TValue> = {
  column?: Column<TData, TValue>
  title?: string
  disabled?: boolean
  options: DataTableFacetedFilterOption[]
  singleSelect?: boolean
}

type DataTableFacetedFilterAsyncProps<TData, TValue> = {
  column?: Column<TData, TValue>
  title?: string
  disabled?: boolean
  options: DataTableFacetedFilterOption[]
  singleSelect?: boolean
  isLoading?: boolean
  onSearch?: (query: string) => void | Promise<void>
  searchPlaceholder?: string
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  disabled,
  singleSelect = false,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const { t } = useTranslation()
  const selectedValues = new Set(column?.getFilterValue() as string[])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 border-dashed'
          disabled={disabled}
        >
          <PlusCircledIcon className='size-4' />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge
                variant='secondary'
                className='rounded-sm px-1 font-normal lg:hidden'
              >
                {selectedValues.size}
              </Badge>
              <div className='hidden space-x-1 lg:flex'>
                {selectedValues.size > 2 ? (
                  <Badge
                    variant='secondary'
                    className='rounded-sm px-1 font-normal'
                  >
                    {t('dataTable.nSelected', { count: selectedValues.size })}
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant='secondary'
                        key={option.value}
                        className='rounded-sm px-1 font-normal'
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-50 p-0' align='start'>
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>{t('noResults')}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (singleSelect) {
                        column?.setFilterValue(
                          isSelected ? undefined : [option.value]
                        )
                      } else {
                        if (isSelected) {
                          selectedValues.delete(option.value)
                        } else {
                          selectedValues.add(option.value)
                        }
                        const filterValues = Array.from(selectedValues)
                        column?.setFilterValue(
                          filterValues.length ? filterValues : undefined
                        )
                      }
                    }}
                  >
                    <div
                      className={cn(
                        'flex size-4 items-center justify-center rounded-sm border border-primary',
                        singleSelect && 'rounded-full',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4 text-background')} />
                    </div>
                    {option.icon && (
                      <option.icon className='size-4 text-muted-foreground' />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className='justify-center text-center text-destructive data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive'
                  >
                    {t('dataTable.clearFilters')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function DataTableFacetedFilterAsync<TData, TValue>({
  column,
  title,
  options,
  disabled,
  singleSelect = false,
  isLoading = false,
  onSearch,
  searchPlaceholder,
}: DataTableFacetedFilterAsyncProps<TData, TValue>) {
  const { t } = useTranslation()
  const selectedValues = new Set(column?.getFilterValue() as string[])
  const [query, setQuery] = React.useState('')

  const handleSearch = React.useCallback(
    (value: string) => {
      setQuery(value)
      void onSearch?.(value)
    },
    [onSearch]
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 border-dashed'
          disabled={disabled}
        >
          <PlusCircledIcon className='size-4' />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge
                variant='secondary'
                className='rounded-sm px-1 font-normal lg:hidden'
              >
                {selectedValues.size}
              </Badge>
              <div className='hidden space-x-1 lg:flex'>
                {selectedValues.size > 2 ? (
                  <Badge
                    variant='secondary'
                    className='rounded-sm px-1 font-normal'
                  >
                    {t('dataTable.nSelected', { count: selectedValues.size })}
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant='secondary'
                        key={option.value}
                        className='rounded-sm px-1 font-normal'
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-50 p-0' align='start'>
        <Command shouldFilter={false}>
          {onSearch && (
            <CommandInput
              placeholder={searchPlaceholder ?? title}
              value={query}
              onValueChange={handleSearch}
            />
          )}
          <CommandList>
            {!isLoading && <CommandEmpty>{t('noResults')}</CommandEmpty>}
            {isLoading ? (
              <CommandGroup>
                <CommandItem disabled>{t('loading')}</CommandItem>
              </CommandGroup>
            ) : (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.has(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        if (singleSelect) {
                          column?.setFilterValue(
                            isSelected ? undefined : [option.value]
                          )
                        } else {
                          if (isSelected) {
                            selectedValues.delete(option.value)
                          } else {
                            selectedValues.add(option.value)
                          }
                          const filterValues = Array.from(selectedValues)
                          column?.setFilterValue(
                            filterValues.length ? filterValues : undefined
                          )
                        }
                      }}
                    >
                      <div
                        className={cn(
                          'flex size-4 items-center justify-center rounded-sm border border-primary',
                          singleSelect && 'rounded-full',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <CheckIcon className={cn('h-4 w-4 text-background')} />
                      </div>
                      {option.icon && (
                        <option.icon className='size-4 text-muted-foreground' />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className='justify-center text-center text-destructive data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive'
                  >
                    {t('dataTable.clearFilters')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
