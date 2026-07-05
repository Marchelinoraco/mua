import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { Service } from '../data/types'

type ServiceDialogType = 'create' | 'edit'

type ServiceContextType = {
  open: ServiceDialogType | null
  setOpen: (str: ServiceDialogType | null) => void
  currentRow: Service | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Service | null>>
}

const ServiceContext = React.createContext<ServiceContextType | null>(null)

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ServiceDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Service | null>(null)

  return (
    <ServiceContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ServiceContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useServiceDialogs = () => {
  const serviceContext = React.useContext(ServiceContext)

  if (!serviceContext) {
    throw new Error(
      'useServiceDialogs has to be used within <ServiceContext>'
    )
  }

  return serviceContext
}
