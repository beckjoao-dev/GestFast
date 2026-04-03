'use client'

import { useState, useMemo } from 'react'
import type { Ingredient } from '@prisma/client'
import type { ExtraCostItem } from '@/components/ExtraCostManager'
import { calcProductCost, formatBRL } from '@/lib/pricing'

interface PIInput  { ingredientId: string; quantity: number }
interface PECInput { extraCostId: string;  quantity: number }

interface FormData {
  name:        string
  timeMinutes: number | null
  marginPct:   number
  batchSize:   number
  salePrice:   number
  ingredients: PIInput[]
  extraCosts:  PECInput[]
  energyCost:  number
  gasCost:     number
  packCost:    number
  otherCost:   number
}

interface Props {
  ingredients:    Ingredient[]
  extraCosts:     ExtraCostItem[]
  defaultValues?: Partial<FormData> & { id?: string }
  mode:           'create' | 'edit'
}

const CATEGORY_ICONS: Record<string, string> = {
  energy: '⚡', gas: '🔥', packaging: '📦', labor: '👤', other: '➕',
}

export default function ProductForm({ ingredients, extraCosts, defaultValues, mode }: Props) {
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState('')
  const [selIngId, setSelIngId] = useState(ingredients[0]?.id ?? '')
  const [selQty,   setSelQty]   = useState('')

  const [form, setForm] = useState<FormData>({
    name:        defaultValues?.name        ?? '',
    timeMinutes: defaultValues?.timeMinutes ?? null,
    marginPct:   defaultValues?.marginPct   ?? 35,
    batchSize:   defaultValues?.batchSize   ?? 1,
    salePrice:   0,
    ingredients: defaultValues?.ingredients ?? [],
    extraCosts:  [],
    energyCost:  defaultValues?.energyCost  ?? 0,
    gasCost:     defaultValues?.gasCost     ?? 0,
    packCost:    defaultValues?.packCost    ?? 0,
    otherCost:   defaultValues?.otherCost   ?? 0,
  })

  function setF<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function addIng() {
    const qty = parseFloat(selQty)
    if (!selIngId || !qty || qty <= 0) return
    setForm(f => ({
      ...f,
      ingredients: f.ingredients.some(i => i.ingredientId === selIngId)
        ? f.ingredients.map(i => i.ingredientId === selIngId ? { ...i, quantity: qty } : i)
        : [...f.ingredients, { ingredientId: selIngId, quantity: qty }],
    }))
    setSelQty('')
  }

  function toggleExtraCost(id: string) {
    setForm(f => {
      const exists = f.extraCosts.some(e => e.extraCostId === id)
      return {
        ...f,
        extraCosts: exists
          ? f.extraCosts.filter(e => e.extraCostId !== id)
          : [...f.extraCosts, { extraCostId: id, quantity: 1 }],
      }
    })
  }

  function setExtraCostQty(id: string, qty: number) {
    setForm(f => ({
      ...f,
      extraCosts: f.extraCosts.map(e => e.extraCostId === id ? { ...e, quantity: qty } : e),
    }))
  }

  const extraCostTotal = useMemo(() =>
    form.extraCosts.reduce((acc, pec) => {
      const ec = extraCosts.find(e => e.id === pec.extraCostId)
      if (!ec) return acc
      return acc + (ec.totalCost / ec.totalQty) * pec.quantity
    }, 0),
    [form.extraCosts, extraCosts]
  )

  const preview = useMemo(() => calcProductCost({
    ingredients: form.ingredients.map(pi => {
      const ing = ingredients.find(i => i.id === pi.ingredientId)
      if (!ing) return { totalCost: 0, totalQty: 1, quantity: pi.quantity }
      return { totalCost: ing.totalCost, totalQty: ing.totalQty, quantity: pi.quantity }
    }),
    energyCost: form.energyCost,
    gasCost:    form.gasCost,
    packCost:   form.packCost + extraCostTotal,
    otherCost:  form.otherCost,
    batchSize:  form.batchSize,
    marginPct:  form.marginPct,
  }), [form, ingredients, extraCostTotal])

  const userProfit = form.salePrice > 0 ? form.salePrice - preview.unitCost : null
  const userMargin = form.salePrice > 0
    ? ((form.salePrice - preview.unitCost) / form.salePrice) * 100
    : null
  const hasProfit = userProfit !== null ? userProfit >= 0 : preview.unitProfit >= 0
  const hasCost   = preview.totalBatchCost > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const url    = mode === 'create' ? '/api/products' : `/api/products/${defaultValues?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
      window.location.href = '/products'
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="alert-danger"><span>⚠️</span>{error}</div>
      )}

      {/* 1. Informações básicas */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Informações do produto</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nome do produto *
            </label>
            <input required value={form.name}
              onChange={e => setF('name', e.target.value)}
              placeholder="Ex: Bolo de Pote, Cookie, Brigadeiro..."
              className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Unidades por lote *
              </label>
              <input type="number" required min="1"
                value={form.batchSize}
                onChange={e => setF('batchSize', parseInt(e.target.value) || 1)}
                className="input" />
              <p className="hint">Quantas unidades você faz de uma vez</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Tempo de preparo (min)
              </label>
              <input type="number" min="0"
                value={form.timeMinutes ?? ''}
                onChange={e => setF('timeMinutes', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Ex: 90" className="input" />
              <p className="hint">Opcional</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ingredientes */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Ingredientes da receita</p>
        </div>
        <div className="p-5">
          {ingredients.length === 0 ? (
            <div className="alert-amber">
              <span>⚠️</span>
              <span>Nenhum ingrediente cadastrado.{' '}
                <a href="/ingredients" className="font-bold underline">Cadastrar agora →</a>
              </span>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <select value={selIngId} onChange={e => setSelIngId(e.target.value)}
                  className="flex-1 input">
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                  ))}
                </select>
                <input type="number" min="0.01" step="0.01"
                  value={selQty}
                  onChange={e => setSelQty(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIng() } }}
                  placeholder="Qtd." className="input w-24" />
                <button type="button" onClick={addIng} className="btn-primary whitespace-nowrap">
                  + Adicionar
                </button>
              </div>
              {form.ingredients.length > 0 ? (
                <div className="space-y-2">
                  {form.ingredients.map(pi => {
                    const ing = ingredients.find(i => i.id === pi.ingredientId)
                    if (!ing) return null
                    const cost = (ing.totalCost / ing.totalQty) * pi.quantity
                    return (
                      <div key={pi.ingredientId}
                        className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-sm font-semibold text-slate-700">{ing.name}</span>
                          <span className="text-xs text-slate-400 ml-2 money">{pi.quantity}{ing.unit}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold money text-emerald-600">{formatBRL(cost)}</span>
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter(i => i.ingredientId !== pi.ingredientId) }))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition text-base">
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-between items-center px-3.5 py-2 text-xs text-slate-500 font-semibold">
                    <span>Total ingredientes (lote)</span>
                    <span className="money">{formatBRL(preview.breakdown.ingredients)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  Selecione um ingrediente e a quantidade acima.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3. Custos operacionais */}
      <div className="card overflow-hidden">
        <div className="section-header flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">3. Custos operacionais</p>
          {extraCosts.length > 0 && (
            <a href="/costs" target="_blank" rel="noreferrer"
              className="text-xs font-semibold text-blue-500 hover:text-blue-700">
              Gerenciar →
            </a>
          )}
        </div>
        <div className="p-5">
          {extraCosts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-semibold text-slate-700 text-sm mb-1">Nenhum custo operacional cadastrado</p>
                <p className="text-slate-400 text-xs mb-3">
                  Cadastre energia, gás e embalagem uma vez. Eles são reutilizados em todos os produtos.
                </p>
                <a href="/costs" className="text-xs font-bold text-blue-600 hover:underline">
                  Cadastrar custos operacionais →
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {extraCosts.map(ec => {
                const perUse   = ec.totalCost / ec.totalQty
                const selected = form.extraCosts.find(e => e.extraCostId === ec.id)
                const isOn     = !!selected
                const lineTotal = isOn ? perUse * (selected?.quantity ?? 1) : 0
                return (
                  <div key={ec.id}
                    className={`rounded-xl border transition-all ${isOn ? 'border-blue-200 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-3 p-3.5">
                      <button type="button" onClick={() => toggleExtraCost(ec.id)}
                        className={`w-10 h-6 rounded-full transition-all shrink-0 relative ${isOn ? 'bg-blue-500' : 'bg-slate-200'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isOn ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                      <span className="text-base">{CATEGORY_ICONS[ec.category] ?? '➕'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{ec.name}</p>
                        <p className="text-xs text-slate-400">{formatBRL(perUse)} por {ec.unit.replace(/s$/, '')}</p>
                      </div>
                      {isOn && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400">Qtd:</span>
                          <input type="number" min="0.01" step="0.01"
                            value={selected?.quantity ?? 1}
                            onChange={e => setExtraCostQty(ec.id, parseFloat(e.target.value) || 1)}
                            className="w-16 text-center text-sm border border-blue-200 bg-white rounded-lg px-2 py-1 outline-none focus:border-blue-400 money" />
                          <span className="text-xs font-bold text-blue-600 money min-w-[60px] text-right">
                            {formatBRL(lineTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {form.extraCosts.length > 0 && (
                <div className="flex justify-between items-center px-3.5 py-2 text-xs text-slate-500 font-semibold">
                  <span>Total custos operacionais (lote)</span>
                  <span className="money">{formatBRL(extraCostTotal)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Precificação */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">4. Precificação</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Margem de lucro desejada (%)
            </label>
            <input type="number" min="1" max="99" step="1"
              value={form.marginPct}
              onChange={e => setF('marginPct', parseFloat(e.target.value) || 35)}
              className="input" />
            <p className="hint">Recomendado: mínimo 35%</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Seu preço de venda (R$)
            </label>
            <input type="number" min="0" step="0.01"
              value={form.salePrice || ''}
              onChange={e => setF('salePrice', parseFloat(e.target.value) || 0)}
              placeholder="Opcional"
              className="input" />
            <p className="hint">Para calcular seu lucro real</p>
          </div>
        </div>
      </div>

      {/* Resultado em tempo real */}
      {hasCost && (
        <div className={`card overflow-hidden border-2 ${hasProfit ? 'border-emerald-200' : 'border-red-200'}`}>
          <div className={`px-5 py-3.5 flex items-center justify-between ${hasProfit ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className={`font-bold text-sm ${hasProfit ? 'text-emerald-700' : 'text-red-700'}`}>
              {hasProfit ? '✅ Produto lucrativo' : '❌ Produto com prejuízo'}
            </p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${hasProfit ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
              {hasProfit ? 'Bom para vender' : 'Ajuste necessário'}
            </span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-400 mb-1 font-medium">Custa fazer</p>
                <p className="text-xl font-black money text-slate-800">{formatBRL(preview.unitCost)}</p>
                <p className="text-xs text-slate-400 mt-1">por unidade</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-blue-500 mb-1 font-medium">Preço ideal ({form.marginPct}% margem)</p>
                <p className="text-xl font-black money text-blue-600">{formatBRL(preview.suggestedPrice)}</p>
                <p className="text-xs text-blue-400 mt-1">por unidade</p>
              </div>
              {form.salePrice > 0 && userProfit !== null && (
                <>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 mb-1 font-medium">Seu preço</p>
                    <p className="text-xl font-black money text-slate-700">{formatBRL(form.salePrice)}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${hasProfit ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-xs mb-1 font-medium ${hasProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                      {hasProfit ? 'Lucro' : 'Prejuízo'} por unidade
                    </p>
                    <p className={`text-xl font-black money ${hasProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                      {hasProfit ? '+' : ''}{formatBRL(userProfit)}
                    </p>
                    {userMargin !== null && (
                      <p className="text-xs text-slate-400 mt-1">Margem real: {userMargin.toFixed(1)}%</p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className={`p-3.5 rounded-xl text-sm font-semibold ${hasProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {hasProfit
                ? form.salePrice > 0
                  ? `🎉 Você ganha ${formatBRL(userProfit!)} em cada unidade vendida.`
                  : `Venda a ${formatBRL(preview.suggestedPrice)}/un. e garanta ${form.marginPct}% de lucro.`
                : form.salePrice > 0
                  ? `Aumente o preço para pelo menos ${formatBRL(preview.suggestedPrice)} para ter lucro.`
                  : 'Adicione ingredientes ou custos para ver o resultado.'}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={() => window.history.back()} className="btn-outline">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="btn-primary px-7">
          {saving ? 'Salvando...' : mode === 'create' ? 'Criar produto' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}
