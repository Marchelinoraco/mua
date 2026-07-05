import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
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
import type { CustomField } from '../data/types'
import {
  useCustomFields,
  useDeleteCustomField,
} from '../hooks/use-custom-fields'
import { CustomFieldFormDialog } from './custom-field-form-dialog'

function CustomFieldListSkeleton() {
  return (
    <div className='space-y-2'>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className='h-12 w-full rounded-md' />
      ))}
    </div>
  )
}

export function CustomFieldList() {
  const { t } = useTranslation('services')
  const { data, isLoading, isError } = useCustomFields()
  const deleteMutation = useDeleteCustomField()

  const [formOpen, setFormOpen] = useState<'create' | 'edit' | null>(null)
  const [currentRow, setCurrentRow] = useState<CustomField | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomField | null>(null)

  function handleAdd() {
    setCurrentRow(null)
    setFormOpen('create')
  }

  function handleEdit(field: CustomField) {
    setCurrentRow(field)
    setFormOpen('edit')
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('customField.title')}</CardTitle>
        <CardDescription>{t('customField.description')}</CardDescription>
        <CardAction>
          <Button size='sm' className='space-x-1' onClick={handleAdd}>
            <span>{t('customField.add')}</span> <Plus size={16} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className='py-8 text-center text-sm text-destructive'>
            {t('customField.loadError')}
          </p>
        ) : isLoading || !data ? (
          <CustomFieldListSkeleton />
        ) : data.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            {t('customField.empty')}
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('customField.columns.label')}</TableHead>
                  <TableHead>{t('customField.columns.tipe')}</TableHead>
                  <TableHead>{t('customField.columns.opsi')}</TableHead>
                  <TableHead>{t('customField.columns.wajib')}</TableHead>
                  <TableHead>{t('customField.columns.urutan')}</TableHead>
                  <TableHead className='text-right'>
                    {t('customField.columns.aksi')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className='font-medium'>
                      {field.label}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>
                        {t(`customFieldTipeOptions.${field.tipe}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {field.opsi && field.opsi.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {field.opsi.map((opt) => (
                            <Badge key={opt} variant='outline'>
                              {opt}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {field.wajib ? (
                        <Badge className='border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'>
                          {t('customField.wajibYa')}
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-muted-foreground'>
                          {t('customField.wajibTidak')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{field.urutan}</TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleEdit(field)}
                        >
                          <Pencil className='h-4 w-4' />
                          <span className='sr-only'>
                            {t('customField.edit')}
                          </span>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setDeleteTarget(field)}
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                          <span className='sr-only'>
                            {t('customField.delete')}
                          </span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CustomFieldFormDialog
        key={currentRow ? `custom-field-edit-${currentRow.id}` : 'custom-field-create'}
        open={formOpen !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(null)
            setTimeout(() => setCurrentRow(null), 300)
          }
        }}
        currentRow={currentRow ?? undefined}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t('customField.deleteDialog.title')}
        desc={t('customField.deleteDialog.desc', {
          label: deleteTarget?.label ?? '',
        })}
        confirmText={t('customField.deleteDialog.confirm')}
        handleConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        destructive
      />
    </Card>
  )
}
