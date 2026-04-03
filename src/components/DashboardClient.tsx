'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface ProductSummary {
  id: string; name: string; marginPct: number
  unitCost: number; suggestedPrice: number; unitProfit: number
  status: 'healthy' | 'low' | 'critical'
}

interface Props {
  products: ProductSummary[]
  bestProductName: string
  avgMargin: number
}

function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export default function DashboardClient({ products, bestProductName, avgMargin }: Props) {
  const [salesPerDay, setSalesPerDay] = useState(10)

  // Lucro total diário e mensal baseado em vendas por dia
  // Distribui igualmente entre os produtos lucrativos
  const profitable = products.filter(p => p.unitProfit > 0)
  const avgUnitProfit = profitable.length > 0
    ? profitable.reduce((a, p) => a + p.unitProfit, 0) / profitable.length
    : 0

  const dailyProfit  = avgUnitProfit * salesPerDay
  const monthlyProfit = dailyProfit * 26  // 26 dias úteis/mês
  const yearlyProfit  = monthlyProfit * 12

  const totalProducts  = products.length
  const profitableCount = profitable.length
  const hasAllProfitable = profitableCount === totalProducts && totalProducts > 0

  return (
    <div className="space-y-4">
      {/* HERO — Lucro potencial */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6">
          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
            💰 Seu potencial de lucro mensal
          </p>
          <div className="flex items-end gap-3 mb-1">
            <p className="text-4xl font-black text-white money tracking-tight">
              {fmtBRL(monthlyProfit)}
            </p>
            <p className="text-emerald-200 text-sm mb-1.5">/ mês</p>
          </div>
          <p className="text-emerald-100 text-sm">
            Vendendo <strong className="text-white">{salesPerDay} unidades por dia</strong> com seus produtos atuais
          </p>
        </div>

        {/* Slider de vendas por dia */}
        <div className="p-5 border-t border-emerald-100 bg-emerald-50/30">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-600">
              Quantas unidades você vende por dia?
            </label>
            <span className="text-sm font-bold text-emerald-600 money">{salesPerDay} un./dia</span>
          </div>
          <input type="range" min="1" max="100" step="1" value={salesPerDay}
            onChange={e => setSalesPerDay(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1 un.</span><span>100 un.</span>
          </div>

          {/* Projeções */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Por dia',  value: dailyProfit },
              { label: 'Por mês',  value: monthlyProfit },
              { label: 'Por ano',  value: yearlyProfit },
            ].map(item => (
              <div key={item.label} className="text-center bg-white rounded-xl border border-emerald-100 p-3">
                <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-emerald-600 money">{fmtBRL(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-p text-center">
          <p className="text-2xl font-black text-blue-500">{totalProducts}</p>
          <p className="text-xs text-slate-400 mt-0.5">Produtos</p>
        </div>
        <div className="card-p text-center">
          <p className={`text-2xl font-black ${hasAllProfitable ? 'text-emerald-500' : 'text-amber-500'}`}>
            {profitableCount}/{totalProducts}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Com lucro</p>
        </div>
        <div className="card-p text-center">
          <p className={`text-2xl font-black ${avgMargin >= 35 ? 'text-emerald-500' : avgMargin >= 20 ? 'text-amber-500' : 'text-red-500'}`}>
            {avgMargin.toFixed(0)}%
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Margem média</p>
        </div>
      </div>

      {/* Destaque: produto mais lucrativo */}
      {bestProductName && profitable.length > 0 && (
        <div className="alert-green">
          <span className="text-xl shrink-0">⭐</span>
          <div className="flex-1">
            <p className="font-bold text-emerald-800">"{bestProductName}" é seu produto estrela!</p>
            <p className="text-xs text-emerald-600 mt-0.5 font-normal">
              É o que traz mais lucro por unidade. Foque em vender mais dele.
            </p>
          </div>
          <Link href="/simulation" className="shrink-0 text-xs font-bold text-emerald-700 hover:underline whitespace-nowrap">
            Simular →
          </Link>
        </div>
      )}
    </div>
  )
}
