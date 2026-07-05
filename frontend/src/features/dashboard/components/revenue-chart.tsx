import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { formatCurrencyIDR } from '@/lib/utils'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { WeeklyRevenuePoint } from '../data/types'

export function RevenueChart({ data }: { data: WeeklyRevenuePoint[] }) {
  const { t } = useTranslation('dashboard')

  const chartConfig = {
    total: {
      label: t('revenueChart.seriesLabel'),
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig

  return (
    <ChartContainer
      config={chartConfig}
      className='aspect-auto h-[280px] w-full'
    >
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
        <defs>
          <linearGradient id='fillWeeklyRevenue' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='var(--color-total)' stopOpacity={0.8} />
            <stop offset='95%' stopColor='var(--color-total)' stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='week'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator='dot'
              formatter={(value) => formatCurrencyIDR(Number(value))}
            />
          }
        />
        <Area
          dataKey='total'
          type='monotone'
          fill='url(#fillWeeklyRevenue)'
          stroke='var(--color-total)'
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
