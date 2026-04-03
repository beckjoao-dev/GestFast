'use client'

import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import type { ProductCostResult, CostBreakdown } from '@/lib/pricing'
import { formatBRL, sortedBreakdown } from '@/lib/pricing'

interface Props {
  result:    ProductCostResult
  productName?: string
}

// ── Tooltip customizado para o Pie ────────────────────────────────────────
function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { pct: number } }[] }) {
  if (!active || !payload?.length) return null
  const { name, value, payload: { pct } } = payload[0]
  return (
    <div className="bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-medium text-white mb-0.5">{name}</div>
      <div className="text-white/60">{formatBRL(value)}</div>
      <div className="text-brand-400">{pct.toFixed(1)}%</div>
    </div>
  )
}

// ── Tooltip customizado para o Bar ────────────────────────────────────────
function BarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-medium text-white mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-mono font-medium text-white">{formatBRL(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Legenda customizada do Pie ────────────────────────────────────────────
function PieLegend({ items }: { items: ReturnType<typeof sortedBreakdown> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
      {items.map(item => (
        <div key={item.key} className="flex items-center gap-1.5 text-xs text-white/60">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
          <span>{item.label}</span>
          <span className="font-mono text-white/40">{item.pct.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Gráfico 1: Composição de custo (Pie)
// ─────────────────────────────────────────────────────────────────────────────
export function CostPieChart({ result }: Props) {
  const items = useMemo(
    () => sortedBreakdown(result.breakdown, result.breakdownPct),
    [result.breakdown, result.breakdownPct]
  )

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-white/25 text-sm">
        Adicione custos para ver o gráfico
      </div>
    )
  }

  const pieData = items.map(item => ({
    name:  item.label,
    value: item.value,
    pct:   item.pct,
    color: item.color,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <PieLegend items={items} />

      {/* Insights */}
      {result.insights.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {result.insights.map((ins, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg
              ${ins.type === 'danger' ? 'bg-red-500/10 text-red-400' :
                ins.type === 'warn'   ? 'bg-amber-500/10 text-amber-400' :
                                        'bg-brand-500/10 text-brand-400'}`}>
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              {ins.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Gráfico 2: Custo vs Preço (Bar) — usado na Simulação
// ─────────────────────────────────────────────────────────────────────────────
interface BarChartProps {
  result: ProductCostResult
  productName?: string
  compareResult?: ProductCostResult   // resultado com outra margem para comparar
  compareLabel?: string
}

export function CostVsPriceBar({ result, productName = 'Atual', compareResult, compareLabel }: BarChartProps) {
  const data = useMemo(() => {
    const base = [
      { name: 'Custo/un.', [productName]: result.unitCost },
      { name: 'Preço',     [productName]: result.suggestedPrice },
      { name: 'Lucro/un.', [productName]: result.unitProfit },
    ]
    if (compareResult && compareLabel) {
      base[0] = { ...base[0], [compareLabel]: compareResult.unitCost }
      base[1] = { ...base[1], [compareLabel]: compareResult.suggestedPrice }
      base[2] = { ...base[2], [compareLabel]: compareResult.unitProfit }
    }
    return base
  }, [result, compareResult, productName, compareLabel])

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="30%" barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `R$${v.toFixed(0)}`}
          width={52}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey={productName} fill="#7c6af7" radius={[4,4,0,0]} />
        {compareResult && compareLabel && (
          <Bar dataKey={compareLabel} fill="#3ecf8e" radius={[4,4,0,0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Gráfico 3: Multi-produto — Lucro por produto (Dashboard)
// ─────────────────────────────────────────────────────────────────────────────
interface MultiBarProps {
  products: { name: string; unitCost: number; suggestedPrice: number; unitProfit: number }[]
}

export function MultiProductBar({ products }: MultiBarProps) {
  if (products.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, products.length * 48)}>
      <BarChart
        data={products}
        layout="vertical"
        barCategoryGap="25%"
        barGap={3}
        margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `R$${v.toFixed(0)}`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="unitCost"       name="Custo"  fill="#4a9eff" radius={[0,4,4,0]} />
        <Bar dataKey="suggestedPrice" name="Preço"  fill="#7c6af7" radius={[0,4,4,0]} />
        <Bar dataKey="unitProfit"     name="Lucro"  fill="#3ecf8e" radius={[0,4,4,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
