import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, UserX, UserCheck, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type User } from '../data/schema'
import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { t } = useTranslation('users')
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    toast.promise(sleep(2000), {
      loading:
        status === 'active'
          ? t('bulk.toastActivating')
          : t('bulk.toastDeactivating'),
      success: () => {
        table.resetRowSelection()
        return status === 'active'
          ? t('bulk.toastActivated', { count: selectedUsers.length })
          : t('bulk.toastDeactivated', { count: selectedUsers.length })
      },
      error:
        status === 'active'
          ? t('bulk.toastErrorActivate')
          : t('bulk.toastErrorDeactivate'),
    })
    table.resetRowSelection()
  }

  const handleBulkInvite = () => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    toast.promise(sleep(2000), {
      loading: t('bulk.toastInviting'),
      success: () => {
        table.resetRowSelection()
        return t('bulk.toastInvited', { count: selectedUsers.length })
      },
      error: t('bulk.toastErrorInvite'),
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='user'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkInvite}
              className='size-8'
              aria-label={t('bulk.invite')}
              title={t('bulk.invite')}
            >
              <Mail />
              <span className='sr-only'>{t('bulk.invite')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('bulk.invite')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkStatusChange('active')}
              className='size-8'
              aria-label={t('bulk.activate')}
              title={t('bulk.activate')}
            >
              <UserCheck />
              <span className='sr-only'>{t('bulk.activate')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('bulk.activate')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkStatusChange('inactive')}
              className='size-8'
              aria-label={t('bulk.deactivate')}
              title={t('bulk.deactivate')}
            >
              <UserX />
              <span className='sr-only'>{t('bulk.deactivate')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('bulk.deactivate')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label={t('bulk.delete')}
              title={t('bulk.delete')}
            >
              <Trash2 />
              <span className='sr-only'>{t('bulk.delete')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('bulk.delete')}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <UsersMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}
