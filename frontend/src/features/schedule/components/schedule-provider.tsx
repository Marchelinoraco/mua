import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { BlockedDate } from '../data/types'

type ScheduleDialogType = 'create-blocked-date' | 'delete-blocked-date'

type ScheduleContextType = {
  open: ScheduleDialogType | null
  setOpen: (str: ScheduleDialogType | null) => void
  currentRow: BlockedDate | null
  setCurrentRow: React.Dispatch<React.SetStateAction<BlockedDate | null>>
}

const ScheduleContext = React.createContext<ScheduleContextType | null>(null)

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ScheduleDialogType>(null)
  const [currentRow, setCurrentRow] = useState<BlockedDate | null>(null)

  return (
    <ScheduleContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ScheduleContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useScheduleDialogs = () => {
  const scheduleContext = React.useContext(ScheduleContext)

  if (!scheduleContext) {
    throw new Error(
      'useScheduleDialogs has to be used within <ScheduleContext>'
    )
  }

  return scheduleContext
}
