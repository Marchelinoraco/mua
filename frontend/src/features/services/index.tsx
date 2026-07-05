import { useTranslation } from 'react-i18next'
import { ConfigDrawer } from '@/components/config-drawer'
import { LanguageSwitch } from '@/components/language-switch'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { CustomFieldList } from './components/custom-field-list'
import { ServiceDialogs } from './components/service-dialogs'
import { ServiceList } from './components/service-list'
import { ServicePrimaryButtons } from './components/service-primary-buttons'
import { ServiceProvider } from './components/service-provider'
import { TransportSettingsCard } from './components/transport-settings-card'

export function Services() {
  const { t } = useTranslation('services')

  return (
    <ServiceProvider>
      <Header fixed>
        <Search className='me-auto' />
        <LanguageSwitch />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('title')}
            </h2>
            <p className='text-muted-foreground'>{t('description')}</p>
          </div>
          <ServicePrimaryButtons />
        </div>

        <ServiceList />
        <TransportSettingsCard />
        <CustomFieldList />
      </Main>

      <ServiceDialogs />
    </ServiceProvider>
  )
}
