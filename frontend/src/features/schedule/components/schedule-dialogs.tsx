import { BlockedDateFormDialog } from './blocked-date-form-dialog'
import { useScheduleDialogs } from './schedule-provider'

export function ScheduleDialogs() {
  const { open, setOpen } = useScheduleDialogs()

  return (
    <>
      <BlockedDateFormDialog
        key='blocked-date-create'
        open={open === 'create-blocked-date'}
        onOpenChange={() => setOpen('create-blocked-date')}
      />
    </>
  )
}
