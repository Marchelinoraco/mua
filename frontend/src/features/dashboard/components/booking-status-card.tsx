import { useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import { useTranslation } from 'react-i18next'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { BOOKING_STATUS_CHART_COLOR, BOOKING_STATUS_ORDER } from '../data/status'
import type { DashboardStats } from '../data/types'

export function BookingStatusCard({
  statusBreakdown,
}: {
  statusBreakdown: DashboardStats['statusBreakdown']
}) {
  const { t } = useTranslation('dashboard')

  const chartConfig = useMemo(
    () =>
      BOOKING_STATUS_ORDER.reduce<ChartConfig>((config, status) => {
        config[status] = {
          label: t(`status.${status}`),
          color: BOOKING_STATUS_CHART_COLOR[status],
        }
        return config
      }, {}),
    [t]
  )

  const chartData = useMemo(
    () =>
      BOOKING_STATUS_ORDER.map((status) => ({
        status,
        value: statusBreakdown[status],
      })).filter((entry) => entry.value > 0),
    [statusBreakdown]
  )

  const total = chartData.reduce((sum, entry) => sum + entry.value, 0)

  if (total === 0) {
    return (
      <p className='py-8 text-center text-sm text-muted-foreground'>
        {t('bookingStatus.empty')}
      </p>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className='mx-auto aspect-square max-h-[280px]'
    >
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey='status' hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey='value'
          nameKey='status'
          innerRadius={60}
          strokeWidth={4}
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.status}
              fill={BOOKING_STATUS_CHART_COLOR[entry.status]}
            />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey='status' />} />
      </PieChart>
    </ChartContainer>
  )
}
