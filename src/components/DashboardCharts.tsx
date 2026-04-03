'use client'

import { MultiProductBar } from '@/components/CostCharts'

interface ChartProduct {
  name:           string
  unitCost:       number
  suggestedPrice: number
  unitProfit:     number
}

interface Props {
  data: ChartProduct[]
}

export default function DashboardCharts({ data }: Props) {
  return <MultiProductBar products={data} />
}
