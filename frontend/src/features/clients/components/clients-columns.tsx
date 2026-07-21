import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import type { ClientListItem } from '../data/types'

export function useClientsColumns(): ColumnDef<ClientListItem>[] {
  const { t } = useTranslation('clients')

  return [
    {
      accessorKey: 'nama',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.nama')}
          sortable={false}
        />
      ),
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.nama}</span>
      ),
      enableSorting: false,
      meta: { label: t('columns.nama') },
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.phone')}
          sortable={false}
        />
      ),
      cell: ({ row }) => (
        <span className='whitespace-nowrap'>{row.original.phone}</span>
      ),
      enableSorting: false,
      meta: { label: t('columns.phone') },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.email')}
          sortable={false}
        />
      ),
      cell: ({ row }) => (
        <span className='text-muted-foreground'>
          {row.original.email ?? '—'}
        </span>
      ),
      enableSorting: false,
      enableHiding: true,
      meta: { label: t('columns.email') },
    },
    {
      accessorKey: 'totalBooking',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.totalBooking')}
          sortable={false}
          className='justify-end'
        />
      ),
      cell: ({ row }) => (
        <div className='text-end tabular-nums'>
          {row.original.totalBooking}
        </div>
      ),
      enableSorting: false,
      meta: { className: 'text-end', label: t('columns.totalBooking') },
    },
    {
      accessorKey: 'jumlahBookingAktif',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.bookingAktif')}
          sortable={false}
          className='justify-end'
        />
      ),
      cell: ({ row }) =>
        row.original.jumlahBookingAktif > 0 ? (
          <div className='text-end'>
            <Badge variant='secondary'>{row.original.jumlahBookingAktif}</Badge>
          </div>
        ) : (
          <div className='text-end text-muted-foreground'>0</div>
        ),
      enableSorting: false,
      meta: { className: 'text-end', label: t('columns.bookingAktif') },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.terdaftar')}
          sortable={false}
        />
      ),
      cell: ({ row }) => (
        <span className='text-sm whitespace-nowrap text-muted-foreground'>
          {formatDate(row.original.createdAt, 'd MMM yyyy')}
        </span>
      ),
      enableSorting: false,
      enableHiding: true,
      meta: { label: t('columns.terdaftar') },
    },
  ]
}
