import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useServiceDialogs } from './service-provider'

export function ServicePrimaryButtons() {
  const { setOpen } = useServiceDialogs()
  const { t } = useTranslation('services')

  return (
    <Button className='space-x-1' onClick={() => setOpen('create')}>
      <span>{t('addService')}</span> <Plus size={18} />
    </Button>
  )
}
