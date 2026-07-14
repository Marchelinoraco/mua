import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useBlockedDates,
  useDeleteBlockedDate,
} from '../hooks/use-blocked-dates'
import { useScheduleDialogs } from './schedule-provider'

function BlockedDatesSkeleton() {
  return (
    <div className='space-y-2'>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className='h-12 w-full rounded-md' />
      ))}
    </div>
  )
}

export function BlockedDatesList() {
  const { t } = useTranslation('schedule')
  const { data, isLoading, isError } = useBlockedDates()
  const deleteMutation = useDeleteBlockedDate()
  const { open, setOpen, currentRow, setCurrentRow } = useScheduleDialogs()

  function handleConfirmDelete() {
    if (!currentRow) return
    deleteMutation.mutate(currentRow.id, {
      onSuccess: () => {
        setOpen(null)
        setCurrentRow(null)
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('blockedDates.title')}</CardTitle>
        <CardDescription>{t('blockedDates.description')}</CardDescription>
        <CardAction>
          <Button
            size='sm'
            className='space-x-1'
            onClick={() => setOpen('create-blocked-date')}
          >
            <span>{t('blockedDates.add')}</span> <Plus size={16} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className='py-8 text-center text-sm text-destructive'>
            {t('blockedDates.loadError')}
          </p>
        ) : isLoading || !data ? (
          <BlockedDatesSkeleton />
        ) : data.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            {t('blockedDates.empty')}
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('blockedDates.columns.tanggal')}</TableHead>
                  <TableHead>{t('blockedDates.columns.alasan')}</TableHead>
                  <TableHead className='text-right'>
                    {t('blockedDates.columns.aksi')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className='font-medium whitespace-nowrap'>
                      {row.tanggalMulai === row.tanggalSelesai
                        ? formatDate(row.tanggalMulai, 'd MMM yyyy')
                        : `${formatDate(row.tanggalMulai, 'd MMM yyyy')} – ${formatDate(row.tanggalSelesai, 'd MMM yyyy')}`}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {row.alasan || '—'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          setCurrentRow(row)
                          setOpen('delete-blocked-date')
                        }}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                        <span className='sr-only'>
                          {t('blockedDates.delete')}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={open === 'delete-blocked-date' && !!currentRow}
        onOpenChange={(state) => {
          if (!state) {
            setOpen(null)
            setCurrentRow(null)
          }
        }}
        title={t('blockedDates.deleteDialog.title')}
        desc={t('blockedDates.deleteDialog.desc', {
          tanggal:
            currentRow && currentRow.tanggalMulai === currentRow.tanggalSelesai
              ? formatDate(currentRow.tanggalMulai, 'd MMM yyyy')
              : currentRow
                ? `${formatDate(currentRow.tanggalMulai, 'd MMM yyyy')} – ${formatDate(currentRow.tanggalSelesai, 'd MMM yyyy')}`
                : '',
        })}
        confirmText={t('blockedDates.deleteDialog.confirm')}
        handleConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        destructive
      />
    </Card>
  )
}
