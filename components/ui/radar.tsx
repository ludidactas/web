'use client'

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts'

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { entries } from 'remeda'

export enum Stat {
  logc = 'Lógica',
  plst = 'Plástica',
  intc = 'Intuición',
  ejct = 'Ejercitación',
  memo = 'Memoria',
}

const chartConfig = {
  valor: {
    label: 'Valor',
  },
} satisfies ChartConfig

interface StatsProps {
  stats: Record<string, number>
}

export default function Stats({ stats }: StatsProps) {
  const chartData = entries(stats).map(([k, v]) => ({ stat: k, valor: v }))

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[420px]">
      <RadarChart data={chartData}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey="stat" />
        <PolarGrid />
        <Radar
          dataKey="valor"
          fill="#aaa"
          fillOpacity={0.6}
          dot={{
            r: 4,
            fillOpacity: 1,
          }}
        />
      </RadarChart>
    </ChartContainer>
  )
}
