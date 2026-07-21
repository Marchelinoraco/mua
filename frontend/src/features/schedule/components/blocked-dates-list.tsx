import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/date'
import { toNaiveLocalDate } from '@/lib/naive-datetime'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  useBlockedDates,
  useDeleteBlockedDate,
} from '../hooks/use-blocked-dates'
import { useScheduleDialogs } from './schedule-provider'

/**
 * `BlockedDate.tanggalMulai`/`tanggalSelesai` adalah kolom Prisma `@db.Date`
 * (tanpa komponen jam) yang diserialisasi sbg ISO datetime jam 00:00:00 UTC.
 * `toNaiveLocalDate` WAJIB dipanggil dulu sebelum `formatDate` — memformat
 * string ISO ini langsung akan menggeser tanggal mundur satu hari di
 * timezone browser DI BELAKANG UTC (lihat catatan bug di `naive-datetime.ts`).
 */
function formatBlockedDate(value: string): string {
  return formatDate(toNaiveLocalDate(value), 'd MMM yyyy')
}

function formatBlockedDateRange(tanggalMulai: string, tanggalSelesai: string) {
  return tanggalMulai === tanggalSelesai
    ? formatBlockedDate(tanggalMulai)
    : `${formatBlockedDate(tanggalMulai)} – ${formatBlockedDate(tanggalSelesai)}`
}

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
                      {formatBlockedDateRange(
                        row.tanggalMulai,
                        row.tanggalSelesai
                      )}
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
          tanggal: currentRow
            ? formatBlockedDateRange(
                currentRow.tanggalMulai,
                currentRow.tanggalSelesai
              )
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
