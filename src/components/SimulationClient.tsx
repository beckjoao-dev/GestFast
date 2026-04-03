'use client'

import { useState, useMemo } from 'react'
import { calcProductCost, formatBRL, sortedBreakdown } from '@/lib/pricing'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Product, ProductIngredient, Ingredient } from '@prisma/client'

type ProductFull = Product & {
  ingredients: (ProductIngredient & { ingredient: Ingredient })[]
}
interface Props { products: ProductFull[] }

interface PieTipProps {
  active?:  boolean
  payload?: Array<{ name: string; value: number; payload: { pct: number } }>
}

function PieTip({ active, payload }: PieTipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700">{p.name}</p>
      <p className="text-slate-500">{formatBRL(p.value)} · {p.payload.pct.toFixed(0)}% do custo</p>
    </div>
  )
}

export default function SimulationClient({ products }: Props) {
  const [selectedId,  setSelectedId]  = useState(products[0]?.id ?? '')
  const [salesPerDay, setSalesPerDay] = useState(10)
  const [priceMode,   setPriceMode]   = useState<'slider' | 'manual'>('slider')
  const [manualPrice, setManualPrice] = useState('')
  const [sliderPrice, setSliderPrice] = useState<number | null>(null)

  const product = useMemo(
    () => products.find(p => p.id === selectedId),
    [selectedId, products]
  )

  const baseInput = useMemo(() => {
    if (!product) return null
    return {
      ingredients: product.ingredients.map(pi => ({
        totalCost: pi.ingredient.totalCost,
        totalQty:  pi.ingredient.totalQty,
        quantity:  pi.quantity,
      })),
      energyCost: product.energyCost,
      gasCost:    product.gasCost,
      packCost:   product.packCost,
      otherCost:  product.otherCost,
      batchSize:  product.batchSize,
    }
  }, [product])

  const unitCostOnly = useMemo(() => {
    if (!baseInput) return 0
    return calcProductCost({ ...baseInput, marginPct: 0.01 }).unitCost
  }, [baseInput])

  const maxPrice = unitCostOnly * 4

  const effectivePrice = useMemo(() => {
    if (sliderPrice !== null) return sliderPrice
    if (!product || !baseInput) return unitCostOnly
    return calcProductCost({ ...baseInput, marginPct: product.marginPct }).suggestedPrice
  }, [sliderPrice, product, baseInput, unitCostOnly])

  const manualPriceNum = parseFloat(manualPrice) || 0
  const activePrice    = priceMode === 'manual' && manualPriceNum > 0 ? manualPriceNum : effectivePrice

  const result = useMemo(() => {
    if (!baseInput) return null
    return calcProductCost({ ...baseInput, marginPct: 35 })
  }, [baseInput])

  const unitProfit    = result ? activePrice - result.unitCost : 0
  const marginReal    = activePrice > 0 ? (unitProfit / activePrice) * 100 : 0
  const hasProfit     = unitProfit > 0
  const dailyProfit   = unitProfit * salesPerDay
  const monthlyProfit = dailyProfit * 26

  const scenarios = useMemo(() => {
    if (!result) return []
    const uc = result.unitCost
    return [
      { label: 'Conservador', pct: 30, price: uc / 0.70, color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100'   },
      { label: 'Recomendado', pct: 40, price: uc / 0.60, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', highlight: true },
      { label: 'Premium',     pct: 55, price: uc / 0.45, color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'    },
    ]
  }, [result])

  const pieData = useMemo(() => {
    if (!result) return []
    return sortedBreakdown(result.breakdown, result.breakdownPct).map(i => ({
      name: i.label, value: i.value, pct: i.pct, color: i.color,
    }))
  }, [result])

  function selectProduct(id: string) {
    setSelectedId(id)
    setSliderPrice(null)
    setManualPrice('')
  }

  if (products.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">💡</div>
        <h3 className="font-bold text-slate-700 mb-2">Nenhum produto para simular</h3>
        <p className="text-slate-400 text-sm mb-5">Crie pelo menos um produto para usar o simulador.</p>
        <a href="/products/new" className="btn-primary">Criar produto</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-4">

      {/* Seletor */}
      <div className="card-p">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Produto que quer analisar
        </label>
        <select value={selectedId} onChange={e => selectProduct(e.target.value)} className="input font-semibold">
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {product && result && (
        <>
          {/* Resultado principal */}
          <div className={`card overflow-hidden border-2 ${hasProfit ? 'border-emerald-200' : 'border-red-200'}`}>
            <div className={`px-5 py-4 ${hasProfit ? 'bg-emerald-500' : 'bg-red-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${hasProfit ? 'text-emerald-100' : 'text-red-100'}`}>
                    {hasProfit ? '✅ Você está lucrando' : '❌ Você está perdendo dinheiro'}
                  </p>
                  <p className="text-white text-3xl font-black money">
                    {hasProfit ? '+' : ''}{formatBRL(unitProfit)}
                    <span className="text-base font-normal ml-1.5 opacity-80">por unidade</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold mb-0.5 ${hasProfit ? 'text-emerald-100' : 'text-red-100'}`}>
                    Margem real
                  </p>
                  <p className="text-white text-2xl font-black">{marginReal.toFixed(0)}%</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="px-5 py-4">
                <p className="text-xs text-slate-400 mb-1">Custa fazer</p>
                <p className="text-lg font-bold money text-slate-800">{formatBRL(result.unitCost)}</p>
                <p className="text-[11px] text-slate-400">por unidade</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-slate-400 mb-1">Você está cobrando</p>
                <p className={`text-lg font-bold money ${hasProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatBRL(activePrice)}
                </p>
                <p className="text-[11px] text-slate-400">por unidade</p>
              </div>
            </div>
            <div className={`px-5 py-3 text-sm font-medium border-t ${hasProfit ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {hasProfit
                ? `Vendendo ${salesPerDay}/dia você lucra ${formatBRL(monthlyProfit)}/mês.`
                : `Aumente para pelo menos ${formatBRL(result.suggestedPrice)} para ter lucro.`}
            </div>
          </div>

          {/* Slider de preço */}
          <div className="card overflow-hidden">
            <div className="section-header flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simule o preço de venda</p>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                {(['slider', 'manual'] as const).map(mode => (
                  <button key={mode} onClick={() => setPriceMode(mode)}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold transition capitalize ${priceMode === mode ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}>
                    {mode === 'slider' ? 'Slider' : 'Digitar'}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {priceMode === 'slider' ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400">Custo: {formatBRL(unitCostOnly)}</span>
                    <span className="text-base font-black text-blue-600 money">{formatBRL(effectivePrice)}</span>
                    <span className="text-xs text-slate-400">Máx: {formatBRL(maxPrice)}</span>
                  </div>
                  <input type="range"
                    min={Math.max(0.01, unitCostOnly * 0.5)}
                    max={maxPrice}
                    step={0.50}
                    value={effectivePrice}
                    onChange={e => setSliderPrice(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Prejudicial</span>
                    <span className="text-emerald-500 font-semibold">Zona lucrativa ✓</span>
                    <span>Premium</span>
                  </div>
                </>
              ) : (
                <div>
                  <input type="number" min="0.01" step="0.01"
                    value={manualPrice}
                    onChange={e => setManualPrice(e.target.value)}
                    placeholder={`Ex: ${formatBRL(result.suggestedPrice)}`}
                    className="input text-lg font-bold money" />
                  <p className="hint">Digite o preço que você cobra ou quer cobrar</p>
                </div>
              )}
            </div>
          </div>

          {/* Projeção mensal */}
          <div className="card overflow-hidden">
            <div className="section-header">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">📈 Projeção de renda</p>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700">Vendas por dia</label>
                <span className="text-sm font-bold money text-blue-600">{salesPerDay} un./dia</span>
              </div>
              <input type="range" min="1" max="100" step="1" value={salesPerDay}
                onChange={e => setSalesPerDay(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer mb-4" />
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Lucro por dia',  val: dailyProfit },
                  { label: 'Lucro por mês',  val: monthlyProfit,       highlight: true },
                  { label: 'Lucro por ano',  val: monthlyProfit * 12 },
                ].map(item => (
                  <div key={item.label}
                    className={`rounded-xl p-4 border text-center ${
                      item.highlight
                        ? (hasProfit ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')
                        : 'bg-slate-50 border-slate-100'
                    }`}>
                    <p className="text-[11px] text-slate-400 mb-1">{item.label}</p>
                    <p className={`text-sm font-black money ${
                      item.highlight ? (hasProfit ? 'text-emerald-600' : 'text-red-600') : 'text-slate-700'
                    }`}>{formatBRL(item.val)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Cenários */}
          <div className="card overflow-hidden">
            <div className="section-header">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">💡 3 cenários de preço</p>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-500 mb-2">
                Veja quanto você ganha em cada preço, vendendo {salesPerDay} unidades/dia:
              </p>
              {scenarios.map(s => {
                const uProfit = s.price - result.unitCost
                const mProfit = uProfit * salesPerDay * 26
                return (
                  <div key={s.label}
                    className={`flex items-center gap-4 rounded-xl border p-4 ${s.border} ${s.bg} ${'highlight' in s && s.highlight ? 'ring-2 ring-emerald-300' : ''}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-700">{s.label}</p>
                        {'highlight' in s && s.highlight && <span className="badge-green">Recomendado</span>}
                      </div>
                      <p className="text-xs text-slate-400">{s.pct}% de margem · {formatBRL(uProfit)}/unidade</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black money ${s.color}`}>{formatBRL(s.price)}</p>
                      <p className="text-[11px] text-slate-400">{formatBRL(mProfit)}/mês</p>
                    </div>
                    <button
                      onClick={() => { setSliderPrice(s.price); setPriceMode('slider') }}
                      className="btn-outline btn-sm text-[11px] shrink-0">
                      Usar
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gráfico de custo */}
          {pieData.length > 0 && (
            <div className="card-p">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                🥧 De onde vem o custo?
              </h3>
              <p className="text-sm text-slate-400 mb-4">Veja o que mais pesa no custo deste produto.</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
                        <span className="text-xs text-slate-600 font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold money text-slate-700">{formatBRL(item.value)}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({item.pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {result.insights.length > 0 && (
                <div className="mt-4 alert-blue">
                  <span className="text-lg shrink-0">💡</span>
                  <p className="text-sm">{result.insights[0].message}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
