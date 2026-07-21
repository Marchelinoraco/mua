import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { toNaiveLocalDate } from '@/lib/naive-datetime'
import { formatCurrencyIDR } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { BOOKING_STATUS_BADGE_CLASS } from '@/features/dashboard/data/status'
import type { OrderListItem } from '../data/types'
import { HoldBadge } from './hold-badge'

/** @param now - epoch ms "sekarang", di-tick berkala oleh OrdersTable agar badge hold hidup. */
export function useOrdersColumns(now: number): ColumnDef<OrderListItem>[] {
  const { t } = useTranslation('orders')

  return [
    {
      accessorKey: 'kodeBooking',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.kodeBooking')}
          sortable={false}
        />
      ),
      cell: ({ row }) => (
        <span className='font-medium whitespace-nowrap'>
          {row.original.kodeBooking}
        </span>
      ),
      enableSorting: false,
      meta: { label: t('columns.kodeBooking') },
    },
    {
      id: 'tanggalAcara',
      accessorFn: (row) => row.tanggalAcara,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.tanggalAcara')}
          sortable={false}
        />
      ),
      cell: ({ row }) => {
        const naive = toNaiveLocalDate(row.original.tanggalAcara)
        return (
          <div className='whitespace-nowrap'>
            <div>{formatDate(naive, 'd MMM yyyy')}</div>
            <div className='text-xs text-muted-foreground'>
              {formatDate(naive, 'HH:mm')}
            </div>
          </div>
        )
      },
      enableSorting: false,
      meta: { label: t('columns.tanggalAcara') },
    },
    {
      id: 'client',
      accessorFn: (row) => row.client.nama,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.klien')}
          sortable={false}
        />
      ),
      cell: ({ row }) => (
        <div>
          <div className='font-medium'>{row.original.client.nama}</div>
          <div className='text-xs text-muted-foreground'>
            {row.original.client.phone}
          </div>
        </div>
      ),
      enableSorting: false,
      meta: { label: t('columns.klien') },
    },
    {
      id: 'items',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.layanan')}
          sortable={false}
        />
      ),
      cell: ({ row }) => (
        <div className='text-sm whitespace-nowrap'>
          {t('columns.jumlahItem', { count: row.original.jumlahItem })}
          <span className='text-muted-foreground'>
            {' · '}
            {t('columns.durasi', { minutes: row.original.totalDurasiMenit })}
          </span>
        </div>
      ),
      enableSorting: false,
      enableHiding: true,
      meta: { label: t('columns.layanan') },
    },
    {
      accessorKey: 'totalHarga',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.total')}
          sortable={false}
          className='justify-end'
        />
      ),
      cell: ({ row }) => (
        <div className='text-end tabular-nums whitespace-nowrap'>
          {formatCurrencyIDR(row.original.totalHarga)}
        </div>
      ),
      enableSorting: false,
      meta: { className: 'text-end', label: t('columns.total') },
    },
    {
      accessorKey: 'dpAmount',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.dp')}
          sortable={false}
          className='justify-end'
        />
      ),
      cell: ({ row }) => (
        <div className='text-end tabular-nums whitespace-nowrap'>
          {formatCurrencyIDR(row.original.dpAmount)}
        </div>
      ),
      enableSorting: false,
      enableHiding: true,
      meta: { className: 'text-end', label: t('columns.dp') },
    },
    {
      id: 'status',
      accessorFn: (row) => row.statusBooking,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('columns.status')}
          sortable={false}
        />
      ),
      cell: ({ row }) => (
        <div className='space-y-1'>
          <Badge
            className={BOOKING_STATUS_BADGE_CLASS[row.original.statusBooking]}
          >
            {t(`status.${row.original.statusBooking}`)}
          </Badge>
          {row.original.statusBooking === 'AWAITING_DP' && (
            <HoldBadge holdUntil={row.original.holdUntil} now={now} />
          )}
        </div>
      ),
      enableSorting: false,
      meta: { label: t('columns.status') },
    },
  ]
}
