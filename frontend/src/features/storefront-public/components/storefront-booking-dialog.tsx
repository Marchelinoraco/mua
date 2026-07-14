import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type StorefrontBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Placeholder CTA booking — alur booking mandiri (F04) belum ada. Dialog ini
 * akan digantikan oleh form booking penuh saat F04 rilis; JANGAN tambahkan
 * form booking di sini.
 */
export function StorefrontBookingDialog({
  open,
  onOpenChange,
}: StorefrontBookingDialogProps) {
  const { t } = useTranslation('storefront')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='text-center sm:max-w-sm'>
        <DialogHeader className='items-center'>
          <div className='mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
            <MessageCircle className='h-6 w-6 text-muted-foreground' />
          </div>
          <DialogTitle>{t('booking.title')}</DialogTitle>
          <DialogDescription>{t('booking.desc')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className='sm:justify-center'>
          <Button onClick={() => onOpenChange(false)}>
            {t('booking.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
