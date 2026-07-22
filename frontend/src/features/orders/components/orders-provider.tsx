import React, { useState } from 'react'
import type { OrderListItem } from '../data/types'

/**
 * Aksi status yang dipicu dari DALAM Sheet detail order (complete pakai
 * ConfirmDialog generik; cancel/reschedule pakai dialog form sendiri).
 * Dipisah dari `detailOpen` (BUKAN union single-`open` seperti pola
 * tasks/users) karena Sheet detail harus TETAP TERBUKA selagi dialog aksi
 * bertumpuk di atasnya — union tunggal akan membuat Sheet ikut tertutup saat
 * salah satu aksi dibuka. Lihat catatan keputusan di changelog F09.
 *
 * TIDAK ADA `'confirm'` di sini — aksi konfirmasi booking (AWAITING_DP ->
 * CONFIRMED) sejak F06 selalu lewat Payment (konfirmasi bukti/tandai tunai),
 * dialognya dikelola LOKAL oleh `OrderPaymentSection` (state per-payment,
 * bukan per-order), bukan lewat union ini. Lihat catatan keputusan F06 di
 * changelog.
 */
export type OrderActionDialogType = 'complete' | 'cancel' | 'reschedule'

type OrdersContextType = {
  detailOpen: boolean
  setDetailOpen: (open: boolean) => void
  actionOpen: OrderActionDialogType | null
  setActionOpen: (type: OrderActionDialogType | null) => void
  currentRow: OrderListItem | null
  setCurrentRow: React.Dispatch<React.SetStateAction<OrderListItem | null>>
}

const OrdersContext = React.createContext<OrdersContextType | null>(null)

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionOpen, setActionOpen] = useState<OrderActionDialogType | null>(
    null
  )
  const [currentRow, setCurrentRow] = useState<OrderListItem | null>(null)

  return (
    <OrdersContext
      value={{
        detailOpen,
        setDetailOpen,
        actionOpen,
        setActionOpen,
        currentRow,
        setCurrentRow,
      }}
    >
      {children}
    </OrdersContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useOrders = () => {
  const ctx = React.useContext(OrdersContext)
  if (!ctx) {
    throw new Error('useOrders has to be used within <OrdersContext>')
  }
  return ctx
}
