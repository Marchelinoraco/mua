import { useTranslation } from 'react-i18next'
import { ContentSection } from '../components/content-section'
import { PaymentProfileForm } from './payment-profile-form'

export function SettingsPayment() {
  const { t } = useTranslation('settings')
  return (
    <ContentSection title={t('payment.title')} desc={t('payment.description')}>
      <PaymentProfileForm />
    </ContentSection>
  )
}
