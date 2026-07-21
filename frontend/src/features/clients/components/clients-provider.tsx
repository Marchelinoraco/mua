import React, { useState } from 'react'
import type { ClientListItem } from '../data/types'

type ClientsContextType = {
  detailOpen: boolean
  setDetailOpen: (open: boolean) => void
  currentRow: ClientListItem | null
  setCurrentRow: React.Dispatch<React.SetStateAction<ClientListItem | null>>
}

const ClientsContext = React.createContext<ClientsContextType | null>(null)

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<ClientListItem | null>(null)

  return (
    <ClientsContext value={{ detailOpen, setDetailOpen, currentRow, setCurrentRow }}>
      {children}
    </ClientsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useClients = () => {
  const ctx = React.useContext(ClientsContext)
  if (!ctx) {
    throw new Error('useClients has to be used within <ClientsContext>')
  }
  return ctx
}
