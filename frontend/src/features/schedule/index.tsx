import { useTranslation } from 'react-i18next'
import { ConfigDrawer } from '@/components/config-drawer'
import { LanguageSwitch } from '@/components/language-switch'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityEditor } from './components/availability-editor'
import { BlockedDatesList } from './components/blocked-dates-list'
import { ScheduleCalendar } from './components/schedule-calendar'
import { ScheduleDialogs } from './components/schedule-dialogs'
import { ScheduleProvider } from './components/schedule-provider'

export function Schedule() {
  const { t } = useTranslation('schedule')

  return (
    <ScheduleProvider>
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
        </div>

        <Tabs defaultValue='calendar' className='w-full'>
          <TabsList>
            <TabsTrigger value='calendar'>{t('tabs.calendar')}</TabsTrigger>
            <TabsTrigger value='availability'>
              {t('tabs.availability')}
            </TabsTrigger>
            <TabsTrigger value='blockedDates'>
              {t('tabs.blockedDates')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='calendar' className='space-y-4'>
            <ScheduleCalendar />
          </TabsContent>

          <TabsContent value='availability' className='space-y-4'>
            <AvailabilityEditor />
          </TabsContent>

          <TabsContent value='blockedDates' className='space-y-4'>
            <BlockedDatesList />
          </TabsContent>
        </Tabs>
      </Main>

      <ScheduleDialogs />
    </ScheduleProvider>
  )
}
