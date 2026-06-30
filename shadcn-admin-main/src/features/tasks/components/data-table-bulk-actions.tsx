import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, CircleArrowUp, ArrowUpDown, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { priorities, statuses } from '../data/data'
import { type Task } from '../data/schema'
import { TasksMultiDeleteDialog } from './tasks-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { t } = useTranslation('tasks')
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: string) => {
    const selectedTasks = selectedRows.map((row) => row.original as Task)
    toast.promise(sleep(2000), {
      loading: t('bulk.toastStatusLoading'),
      success: () => {
        table.resetRowSelection()
        return t('bulk.toastStatusSuccess', {
          status,
          count: selectedTasks.length,
        })
      },
      error: t('bulk.toastError'),
    })
    table.resetRowSelection()
  }

  const handleBulkPriorityChange = (priority: string) => {
    const selectedTasks = selectedRows.map((row) => row.original as Task)
    toast.promise(sleep(2000), {
      loading: t('bulk.toastPriorityLoading'),
      success: () => {
        table.resetRowSelection()
        return t('bulk.toastPrioritySuccess', {
          priority,
          count: selectedTasks.length,
        })
      },
      error: t('bulk.toastError'),
    })
    table.resetRowSelection()
  }

  const handleBulkExport = () => {
    const selectedTasks = selectedRows.map((row) => row.original as Task)
    toast.promise(sleep(2000), {
      loading: t('bulk.toastExportLoading'),
      success: () => {
        table.resetRowSelection()
        return t('bulk.toastExportSuccess', { count: selectedTasks.length })
      },
      error: t('bulk.toastError'),
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='task'>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label={t('bulk.updateStatus')}
                  title={t('bulk.updateStatus')}
                >
                  <CircleArrowUp />
                  <span className='sr-only'>{t('bulk.updateStatus')}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('bulk.updateStatus')}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.value}
                defaultValue={status.value}
                onClick={() => handleBulkStatusChange(status.value)}
              >
                {status.icon && (
                  <status.icon className='size-4 text-muted-foreground' />
                )}
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label={t('bulk.updatePriority')}
                  title={t('bulk.updatePriority')}
                >
                  <ArrowUpDown />
                  <span className='sr-only'>{t('bulk.updatePriority')}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('bulk.updatePriority')}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {priorities.map((priority) => (
              <DropdownMenuItem
                key={priority.value}
                defaultValue={priority.value}
                onClick={() => handleBulkPriorityChange(priority.value)}
              >
                {priority.icon && (
                  <priority.icon className='size-4 text-muted-foreground' />
                )}
                {priority.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label={t('bulk.export')}
              title={t('bulk.export')}
            >
              <Download />
              <span className='sr-only'>{t('bulk.export')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('bulk.export')}</p>
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

      <TasksMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  )
}
