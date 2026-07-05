import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { LanguageSwitch } from '@/components/language-switch'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Analytics } from './components/analytics'
import { BookingStatusCard } from './components/booking-status-card'
import { PopularServices } from './components/popular-services'
import { RecentBookingsTable } from './components/recent-bookings-table'
import { RevenueChart } from './components/revenue-chart'
import { StatCards } from './components/stat-cards'
import { TrialBanner } from './components/trial-banner'
import { UpcomingBookings } from './components/upcoming-bookings'
import { useDashboardStats } from './hooks/use-dashboard-stats'

function DashboardOverviewSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-[112px] w-full rounded-xl' />
        ))}
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <Skeleton className='col-span-1 h-[380px] w-full rounded-xl lg:col-span-4' />
        <Skeleton className='col-span-1 h-[380px] w-full rounded-xl lg:col-span-3' />
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <Skeleton className='col-span-1 h-[420px] w-full rounded-xl lg:col-span-4' />
        <Skeleton className='col-span-1 h-[420px] w-full rounded-xl lg:col-span-3' />
      </div>
    </div>
  )
}

export function Dashboard() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { data, isLoading, isError } = useDashboardStats()

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search className='me-auto' />
        <LanguageSwitch />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <TrialBanner />
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>{t('title')}</h1>
          <div className='flex items-center space-x-2'>
            <Button>{tCommon('download')}</Button>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>{t('tabs.overview')}</TabsTrigger>
              <TabsTrigger value='analytics'>{t('tabs.analytics')}</TabsTrigger>
              <TabsTrigger value='reports' disabled>
                {t('tabs.reports')}
              </TabsTrigger>
              <TabsTrigger value='notifications' disabled>
                {t('tabs.notifications')}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            {isError ? (
              <p className='py-12 text-center text-sm text-destructive'>
                {t('loadError')}
              </p>
            ) : isLoading || !data ? (
              <DashboardOverviewSkeleton />
            ) : (
              <>
                <StatCards data={data} />

                <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                  <Card className='col-span-1 lg:col-span-4'>
                    <CardHeader>
                      <CardTitle>{t('revenueChart.title')}</CardTitle>
                      <CardDescription>
                        {t('revenueChart.description')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='ps-2'>
                      <RevenueChart data={data.weeklyRevenue} />
                    </CardContent>
                  </Card>
                  <Card className='col-span-1 lg:col-span-3'>
                    <CardHeader>
                      <CardTitle>{t('bookingStatus.title')}</CardTitle>
                      <CardDescription>
                        {t('bookingStatus.description')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BookingStatusCard
                        statusBreakdown={data.statusBreakdown}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                  <Card className='col-span-1 lg:col-span-4'>
                    <CardHeader>
                      <CardTitle>{t('recentBookings.title')}</CardTitle>
                      <CardDescription>
                        {t('recentBookings.description', {
                          count: data.recentBookings.length,
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RecentBookingsTable bookings={data.recentBookings} />
                    </CardContent>
                  </Card>
                  <div className='col-span-1 space-y-4 lg:col-span-3'>
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('upcomingBookings.title')}</CardTitle>
                        <CardDescription>
                          {t('upcomingBookings.description')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <UpcomingBookings bookings={data.upcomingBookings} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('popularServices.title')}</CardTitle>
                        <CardDescription>
                          {t('popularServices.description')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PopularServices services={data.popularServices} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
