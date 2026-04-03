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
  // Legado mantido para dados antigos
  energyCost: number; gasCost: number; packCost: number; otherCost: number
}

interface Props {
  ingredients: Ingredient[]
  extraCosts:  ExtraCostItem[]
  defaultValues?: Partial<FormData> & { id?: string }
  mode: 'create' | 'edit'
}

const CATEGORY_ICONS: Record<string, string> = {
  energy: '⚡', gas: '🔥', packaging: '📦', labor: '👤', other: '➕',
}

export default function ProductForm({ ingredients, extraCosts, defaultValues, mode }: Props) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [selIngId, setSelIngId] = useState(ingredients[0]?.id ?? '')
  const [selQty,   setSelQty]   = useState('')

  const [form, setForm] = useState<FormData>({
    name:        defaultValues?.name        ?? '',
    timeMinutes: defaultValues?.timeMinutes ?? null,
    marginPct:   defaultValues?.marginPct   ?? 35,
    batchSize:   defaultValues?.batchSize   ?? 1,
    salePrice:   (defaultValues as { salePrice?: number })?.salePrice ?? 0,
    ingredients: defaultValues?.ingredients ?? [],
    extraCosts:  (defaultValues as { extraCosts?: PECInput[] })?.extraCosts ?? [],
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

  // Calcula custo total dos extraCosts selecionados
  const extraCostTotal = useMemo(() => {
    return form.extraCosts.reduce((acc, pec) => {
      const ec = extraCosts.find(e => e.id === pec.extraCostId)
      if (!ec) return acc
      return acc + (ec.totalCost / ec.totalQty) * pec.quantity
    }, 0)
  }, [form.extraCosts, extraCosts])

  // Preview em tempo real — soma ingredientes + custos extras selecionados + legado
  const preview = useMemo(() => calcProductCost({
    ingredients: form.ingredients.map(pi => {
      const ing = ingredients.find(i => i.id === pi.ingredientId)
      if (!ing) return { totalCost: 0, totalQty: 1, quantity: pi.quantity }
      return { totalCost: ing.totalCost, totalQty: ing.totalQty, quantity: pi.quantity }
    }),
    energyCost: form.energyCost,
    gasCost:    form.gasCost,
    packCost:   form.packCost + extraCostTotal,  // soma os custos extras aqui
    otherCost:  form.otherCost,
    batchSize:  form.batchSize,
    marginPct:  form.marginPct,
  }), [form, ingredients, extraCostTotal])

  const userProfit = form.salePrice > 0 ? form.salePrice - preview.unitCost : null
  const userMargin = form.salePrice > 0
    ? ((form.salePrice - preview.unitCost) / form.salePrice) * 100
    : null
  const hasProfit  = userProfit !== null ? userProfit >= 0 : preview.unitProfit >= 0
  const hasCost    = preview.totalBatchCost > 0

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
      if (!res.ok) { setError(json.error); return }
      window.location.href = '/products'
    } catch { setError('Erro ao salvar. Tente novamente.') }
    finally { setSaving(false) }
  }

  const lc = 'block text-sm font-semibold text-slate-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      {/* ── 1. Informações básicas ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-50 bg-slate-50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-700">1. Informações do produto</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={lc}>Nome do produto *</label>
            <input required value={form.name}
              onChange={e => setF('name', e.target.value)}
              placeholder="Ex: Bolo de Pote, Cookie Recheado, Brigadeiro..."
              className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Unidades produzidas por lote *</label>
              <input type="number" required min="1"
                value={form.batchSize}
                onChange={e => setF('batchSize', parseInt(e.target.value) || 1)}
                className="input" />
              <p className="text-xs text-slate-400 mt-1">Quantas unidades você faz de uma vez</p>
            </div>
            <div>
              <label className={lc}>Tempo de preparo (min)</label>
              <input type="number" min="0"
                value={form.timeMinutes ?? ''}
                onChange={e => setF('timeMinutes', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Ex: 90"
                className="input" />
              <p className="text-xs text-slate-400 mt-1">Opcional</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Ingredientes ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-50 bg-slate-50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-700">2. Ingredientes da receita</h2>
        </div>
        <div className="p-5">
          {ingredients.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
              <span>⚠️</span>
              <span>Nenhum ingrediente cadastrado.{' '}
                <a href="/ingredients" className="font-semibold underline">Cadastrar agora →</a>
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
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIng())}
                  placeholder="Qtd."
                  className="input w-24" />
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
                          <span className="text-sm font-medium text-slate-700">{ing.name}</span>
                          <span className="text-xs text-slate-400 ml-2 font-mono">{pi.quantity}{ing.unit}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold font-mono text-emerald-600">{formatBRL(cost)}</span>
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, ingredients: f.ingredients.filter(i => i.ingredientId !== pi.ingredientId) }))}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition text-base">
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-between items-center px-3.5 py-2 text-xs text-slate-500 font-medium">
                    <span>Total ingredientes (lote)</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {formatBRL(preview.breakdown.ingredients)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  Nenhum ingrediente adicionado. Selecione acima.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── 3. Custos operacionais ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-50 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">3. Custos operacionais</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Energia, gás, embalagens cadastrados na tela Custos</p>
          </div>
          {extraCosts.length > 0 && (
            <a href="/costs" target="_blank"
              className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1">
              Gerenciar →
            </a>
          )}
        </div>
        <div className="p-5">
          {extraCosts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-500 flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-medium text-slate-700 mb-1">Nenhum custo operacional cadastrado</p>
                <p className="text-slate-400 text-xs mb-3">Cadastre energia, gás, embalagem e outros custos uma vez. Eles serão reaproveitados em todos os produtos.</p>
                <a href="/costs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
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
                    className={`rounded-xl border transition-all ${isOn
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-slate-100 bg-slate-50 opacity-70 hover:opacity-100'}`}>
                    <div className="flex items-center gap-3 p-3.5">
                      {/* Toggle */}
                      <button type="button" onClick={() => toggleExtraCost(ec.id)}
                        className={`w-10 h-6 rounded-full transition-all shrink-0 relative ${isOn ? 'bg-blue-500' : 'bg-slate-200'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isOn ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                      <span className="text-base">{CATEGORY_ICONS[ec.category] ?? '➕'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{ec.name}</p>
                        <p className="text-xs text-slate-400">{formatBRL(perUse)} por {ec.unit.replace(/s$/, '')}</p>
                      </div>
                      {isOn && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400">Qtd:</span>
                          <input type="number" min="0.01" step="0.01"
                            value={selected?.quantity ?? 1}
                            onChange={e => setExtraCostQty(ec.id, parseFloat(e.target.value) || 1)}
                            className="w-16 text-center text-sm border border-blue-200 bg-white rounded-lg px-2 py-1 outline-none focus:border-blue-400 font-mono" />
                          <span className="text-xs text-blue-600 font-semibold font-mono min-w-[60px] text-right">
                            {formatBRL(lineTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {form.extraCosts.length > 0 && (
                <div className="flex justify-between items-center px-3.5 py-2 text-xs font-medium text-slate-500">
                  <span>Total custos operacionais (lote)</span>
                  <span className="font-mono font-semibold text-slate-700">{formatBRL(extraCostTotal)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Precificação ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-50 bg-slate-50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-700">4. Precificação</h2>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <label className={lc}>Margem de lucro desejada (%)</label>
            <input type="number" min="1" max="99" step="1"
              value={form.marginPct}
              onChange={e => setF('marginPct', parseFloat(e.target.value) || 35)}
              className="input" />
            <p className="text-xs text-slate-400 mt-1">Recomendado: mínimo 35%</p>
          </div>
          <div>
            <label className={lc}>Seu preço de venda (R$)</label>
            <input type="number" min="0" step="0.01"
              value={form.salePrice || ''}
              onChange={e => setF('salePrice', parseFloat(e.target.value) || 0)}
              placeholder="Opcional"
              className="input" />
            <p className="text-xs text-slate-400 mt-1">Para calcular seu lucro real</p>
          </div>
        </div>
      </div>

      {/* ── Resultado em tempo real ───────────────────────────────────── */}
      {hasCost && (
        <div className={`rounded-2xl border-2 overflow-hidden ${
          hasProfit ? 'border-emerald-200' : 'border-red-200'}`}>
          <div className={`px-5 py-3.5 flex items-center justify-between ${
            hasProfit ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <h2 className={`font-bold text-sm ${hasProfit ? 'text-emerald-700' : 'text-red-700'}`}>
              {hasProfit ? '✅ Resultado: Lucrativo' : '❌ Resultado: Prejuízo'}
            </h2>
            {hasProfit
              ? <span className="text-xs text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full font-medium">Bom para vender</span>
              : <span className="text-xs text-red-600 bg-red-100 px-3 py-1 rounded-full font-medium">Ajuste necessário</span>}
          </div>
          <div className="bg-white p-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs text-slate-400 mb-1 font-medium">Custo por unidade</p>
                <p className="text-xl font-bold font-mono text-slate-800">{formatBRL(preview.unitCost)}</p>
                <p className="text-xs text-slate-400 mt-1">O que você gasta para produzir cada unidade</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-blue-500 mb-1 font-medium">Preço sugerido pelo sistema</p>
                <p className="text-xl font-bold font-mono text-blue-600">{formatBRL(preview.suggestedPrice)}</p>
                <p className="text-xs text-blue-400 mt-1">Com {form.marginPct}% de margem de lucro</p>
              </div>
              {form.salePrice > 0 && userProfit !== null && (
                <>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 mb-1 font-medium">Seu preço de venda</p>
                    <p className="text-xl font-bold font-mono text-slate-700">{formatBRL(form.salePrice)}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${hasProfit ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-xs mb-1 font-medium ${hasProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                      {hasProfit ? 'Lucro por unidade' : 'Prejuízo por unidade'}
                    </p>
                    <p className={`text-xl font-bold font-mono ${hasProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                      {hasProfit ? '+' : ''}{formatBRL(userProfit)}
                    </p>
                    {userMargin !== null && (
                      <p className="text-xs text-slate-400 mt-1">Margem real: {userMargin.toFixed(1)}%</p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className={`p-3.5 rounded-xl text-sm font-medium ${
              hasProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {hasProfit
                ? form.salePrice > 0
                  ? `Você ganha ${formatBRL(userProfit!)} em cada unidade vendida. 🎉`
                  : `Venda a ${formatBRL(preview.suggestedPrice)} por unidade e garanta ${form.marginPct}% de lucro.`
                : form.salePrice > 0
                  ? `Com esse preço você perde ${formatBRL(Math.abs(userProfit!))} por unidade. Aumente o preço para pelo menos ${formatBRL(preview.suggestedPrice)}.`
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
