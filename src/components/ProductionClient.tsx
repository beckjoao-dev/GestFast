'use client'

import { useState, useMemo } from 'react'
import type { Recipe, RecipeItem, RawMaterial, Production } from '@/types'
import type { Product } from '@prisma/client'
import { fmtBRL } from '@/services/cost-calculator'

type ProductWithRecipe = Product & {
  recipe: (Recipe & { items: (RecipeItem & { rawMaterial: RawMaterial })[] }) | null
}
type ProductionWithProduct = Production & { product: { name: string } }

interface Props {
  initialProducts:   ProductWithRecipe[]
  initialProductions: ProductionWithProduct[]
}

interface StockCheckResult {
  canProduce: boolean
  shortages:  { name: string; needed: number; available: number; unit: string }[]
  totalCost:  number
  unitCost:   number
}

export default function ProductionClient({ initialProducts, initialProductions }: Props) {
  const [productions, setProductions] = useState(initialProductions)
  const [selectedId,  setSelectedId]  = useState(initialProducts[0]?.id ?? '')
  const [qty,         setQty]         = useState(1)
  const [notes,       setNotes]       = useState('')
  const [checking,    setChecking]    = useState(false)
  const [executing,   setExecuting]   = useState(false)
  const [check,       setCheck]       = useState<StockCheckResult | null>(null)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')

  const selectedProduct = useMemo(
    () => initialProducts.find(p => p.id === selectedId),
    [selectedId, initialProducts]
  )

  async function handleCheck() {
    setChecking(true); setCheck(null); setError('')
    try {
      const res  = await fetch('/api/productions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedId, qty, execute: false }),
      })
      const json = await res.json()
      setCheck(json.data.check)
    } catch { setError('Erro ao verificar estoque') }
    finally { setChecking(false) }
  }

  async function handleExecute() {
    setExecuting(true); setError('')
    try {
      const res  = await fetch('/api/productions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedId, qty, notes, execute: true }),
      })
      const json = await res.json()
      if (!res.ok || !json.data.ok) {
        setError(json.data?.message ?? json.error ?? 'Erro ao produzir'); return
      }
      setProductions(prev => [{ ...json.data.production, product: { name: selectedProduct?.name ?? '' } }, ...prev])
      setSuccess(`✅ ${qty} unidade(s) de "${selectedProduct?.name}" produzidas com sucesso!`)
      setCheck(null); setQty(1); setNotes('')
      setTimeout(() => setSuccess(''), 5000)
    } catch { setError('Erro de conexão') }
    finally { setExecuting(false) }
  }

  const hasRecipe = !!selectedProduct?.recipe

  return (
    <div className="max-w-3xl space-y-5">

      {/* Painel de produção */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-bold text-slate-700">Nova produção</p>
        </div>
        <div className="p-6 space-y-4">
          {error   && <div className="alert-danger"><span>⚠️</span>{error}</div>}
          {success && <div className="alert-green"><span>✅</span>{success}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Produto *</label>
              <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setCheck(null) }}
                className="input w-full">
                {initialProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {!hasRecipe && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  ⚠ Este produto não tem ficha técnica cadastrada.
                  <a href="/products" className="underline ml-1">Cadastrar →</a>
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Quantidade *</label>
              <input type="number" min="1" step="1" value={qty}
                onChange={e => { setQty(parseInt(e.target.value) || 1); setCheck(null) }}
                className="input w-full" />
              {selectedProduct?.recipe && (
                <p className="text-xs text-slate-400 mt-1">
                  Rende {Number(selectedProduct.recipe.yieldQty)} {selectedProduct.recipe.yieldUnit} por lote
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Observações</label>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Opcional" className="input w-full" />
            </div>
          </div>

          {/* Verificação de estoque */}
          {check && (
            <div className={`rounded-xl border p-4 ${check.canProduce ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <p className={`font-bold text-sm mb-3 ${check.canProduce ? 'text-emerald-700' : 'text-red-700'}`}>
                {check.canProduce ? '✅ Estoque suficiente para produzir' : '❌ Estoque insuficiente'}
              </p>
              {check.shortages.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {check.shortages.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-red-600 bg-red-100 rounded-lg px-3 py-2">
                      <span className="font-semibold">{s.name}</span>
                      <span>Precisa: <b>{s.needed.toFixed(1)}{s.unit}</b> · Disponível: <b>{s.available.toFixed(1)}{s.unit}</b></span>
                    </div>
                  ))}
                </div>
              )}
              {check.canProduce && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                    <p className="text-xs text-slate-400 mb-0.5">Custo total</p>
                    <p className="font-bold money text-slate-800">{fmtBRL(check.totalCost)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                    <p className="text-xs text-slate-400 mb-0.5">Custo por unidade</p>
                    <p className="font-bold money text-slate-800">{fmtBRL(check.unitCost)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            {!check && (
              <button onClick={handleCheck} disabled={checking || !hasRecipe}
                className="btn-outline disabled:opacity-50">
                {checking ? 'Verificando...' : '🔍 Verificar estoque'}
              </button>
            )}
            {check && !check.canProduce && (
              <button onClick={() => setCheck(null)} className="btn-outline">Rever</button>
            )}
            {check?.canProduce && (
              <button onClick={handleExecute} disabled={executing}
                className="btn-green disabled:opacity-50">
                {executing ? 'Produzindo...' : `⚙️ Produzir ${qty} unidade(s)`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Histórico de produção</p>
        </div>
        {productions.length === 0 ? (
          <div className="py-12 text-center text-slate-300">
            <div className="text-4xl mb-2">⚙️</div>
            <p className="text-sm">Nenhuma produção registrada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {productions.map(prod => (
              <div key={prod.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-base">⚙️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{prod.product.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(prod.createdAt).toLocaleDateString('pt-BR')} · {prod.notes ?? 'Sem observações'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold money text-slate-800">{Number(prod.qty)} un.</p>
                  <p className="text-xs text-slate-400">{fmtBRL(Number(prod.totalCost))}</p>
                </div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                  prod.status === 'COMPLETED' ? 'badge-green' :
                  prod.status === 'CANCELLED' ? 'badge-red' : 'badge-amber'
                }`}>
                  {prod.status === 'COMPLETED' ? 'Concluída' : prod.status === 'CANCELLED' ? 'Cancelada' : 'Planejada'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
