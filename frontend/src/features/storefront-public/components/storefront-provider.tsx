import { createContext, useContext, type ReactNode } from 'react'
import useDialogState from '@/hooks/use-dialog-state'

type StorefrontDialogType = 'report' | 'booking'

interface StorefrontContextValue {
  open: StorefrontDialogType | null
  setOpen: (value: StorefrontDialogType | null) => void
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null)

/** Context state dialog untuk storefront publik (report + booking mandiri F04). */
export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useDialogState<StorefrontDialogType>()

  return (
    <StorefrontContext value={{ open, setOpen }}>{children}</StorefrontContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStorefrontDialogs() {
  const ctx = useContext(StorefrontContext)
  if (!ctx) {
    throw new Error(
      'useStorefrontDialogs must be used within StorefrontProvider'
    )
  }
  return ctx
}
