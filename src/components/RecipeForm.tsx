'use client'

import { useState, useMemo } from 'react'
import type { RawMaterial, Recipe, RecipeItem } from '@/types'
import { fmtBRL } from '@/services/cost-calculator'

type RecipeWithItems = Recipe & {
  items: (RecipeItem & { rawMaterial: RawMaterial })[]
}

interface Props {
  productId:     string
  productName:   string
  rawMaterials:  RawMaterial[]
  initialRecipe: RecipeWithItems | null
  laborCostPerHour: number
  onSaved?:      () => void
}

interface FormItem {
  rawMaterialId: string
  quantity:      string
}

const YIELD_UNITS = ['un','g','kg','ml','l']

export default function RecipeForm({
  productId, productName, rawMaterials, initialRecipe, laborCostPerHour, onSaved
}: Props) {
  const [yieldQty,      setYieldQty]      = useState(String(initialRecipe?.yieldQty ?? 10))
  const [yieldUnit,     setYieldUnit]     = useState(initialRecipe?.yieldUnit ?? 'un')
  const [laborMinutes,  setLaborMinutes]  = useState(String(initialRecipe?.laborMinutes ?? 0))
  const [packagingCost, setPackagingCost] = useState(String(initialRecipe?.packagingCost ?? 0))
  const [extraCost,     setExtraCost]     = useState(String(initialRecipe?.extraCost ?? 0))
  const [notes,         setNotes]         = useState(initialRecipe?.notes ?? '')
  const [items, setItems] = useState<FormItem[]>(
    initialRecipe?.items.map(i => ({
      rawMaterialId: i.rawMaterialId,
      quantity:      String(i.quantity),
    })) ?? []
  )
  const [selMat, setSelMat] = useState(rawMaterials[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [saved,  setSaved]  = useState(false)

  // Preview de custo em tempo real
  const preview = useMemo(() => {
    let ingredientCost = 0
    for (const item of items) {
      const mat = rawMaterials.find(m => m.id === item.rawMaterialId)
      if (!mat) continue
      const qty     = parseFloat(item.quantity) || 0
      const factor  = mat.unit === 'kg' || mat.unit === 'l' ? 1000 : 1
      const baseQty = qty * factor
      ingredientCost += baseQty * Number(mat.unitCost)
    }
    const labor   = (parseFloat(laborMinutes) / 60) * laborCostPerHour
    const pack    = parseFloat(packagingCost) || 0
    const extra   = parseFloat(extraCost) || 0
    const total   = ingredientCost + labor + pack + extra
    const yield_  = parseFloat(yieldQty) || 1
    const unitCost = total / yield_
    return { ingredientCost, labor, pack, extra, total, unitCost }
  }, [items, laborMinutes, packagingCost, extraCost, yieldQty, rawMaterials, laborCostPerHour])

  function addItem() {
    if (!selMat) return
    if (items.some(i => i.rawMaterialId === selMat)) return
    setItems(prev => [...prev, { rawMaterialId: selMat, quantity: '' }])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.rawMaterialId !== id))
  }

  function updateQty(id: string, qty: string) {
    setItems(prev => prev.map(i => i.rawMaterialId === id ? { ...i, quantity: qty } : i))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const res  = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          yieldQty:     parseFloat(yieldQty),
          yieldUnit,
          laborMinutes: parseInt(laborMinutes) || 0,
          packagingCost: parseFloat(packagingCost) || 0,
          extraCost:    parseFloat(extraCost) || 0,
          notes: notes || undefined,
          items: items.map(i => ({ rawMaterialId: i.rawMaterialId, quantity: parseFloat(i.quantity) }))
            .filter(i => i.quantity > 0),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSaved?.()
    } catch { setError('Erro de conexão') }
    finally { setSaving(false) }
  }

  const ic = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition'
  const lc = 'block text-xs font-semibold text-slate-600 mb-1.5'

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {error && <div className="alert-danger"><span>⚠️</span>{error}</div>}
      {saved && <div className="alert-green"><span>✅</span>Ficha técnica salva! Custos recalculados automaticamente.</div>}

      {/* Rendimento */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rendimento da receita</p>
        </div>
        <div className="p-5 grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={lc}>Quantas unidades essa receita rende? *</label>
            <input required type="number" min="0.01" step="0.01" value={yieldQty}
              onChange={e => setYieldQty(e.target.value)} className={ic}
              placeholder="Ex: 20" />
            <p className="text-xs text-slate-400 mt-1">Ex: uma receita rende 20 brigadeiros</p>
          </div>
          <div>
            <label className={lc}>Unidade</label>
            <select value={yieldUnit} onChange={e => setYieldUnit(e.target.value)} className={ic}>
              {YIELD_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className={lc}>Tempo de preparo (min)</label>
            <input type="number" min="0" value={laborMinutes}
              onChange={e => setLaborMinutes(e.target.value)} className={ic} placeholder="Ex: 60" />
          </div>
          <div>
            <label className={lc}>Custo de embalagem (R$)</label>
            <input type="number" min="0" step="0.01" value={packagingCost}
              onChange={e => setPackagingCost(e.target.value)} className={ic} placeholder="0.00" />
          </div>
          <div>
            <label className={lc}>Outros custos (R$)</label>
            <input type="number" min="0" step="0.01" value={extraCost}
              onChange={e => setExtraCost(e.target.value)} className={ic} placeholder="0.00" />
          </div>
          <div className="col-span-3">
            <label className={lc}>Observações</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className={ic}
              placeholder="Modo de preparo, dicas, temperatura..." />
          </div>
        </div>
      </div>

      {/* Ingredientes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingredientes da receita</p>
        </div>
        <div className="p-5">
          {rawMaterials.length === 0 ? (
            <div className="alert-amber">
              <span>⚠️</span>
              <span>Cadastre matérias-primas primeiro. <a href="/stock" className="font-bold underline">Ir para Estoque →</a></span>
            </div>
          ) : (
            <div className="flex gap-2 mb-4">
              <select value={selMat} onChange={e => setSelMat(e.target.value)} className={`${ic} flex-1`}>
                {rawMaterials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                ))}
              </select>
              <button type="button" onClick={addItem} className="btn-primary whitespace-nowrap">+ Adicionar</button>
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map(item => {
                const mat    = rawMaterials.find(m => m.id === item.rawMaterialId)
                if (!mat) return null
                const qty    = parseFloat(item.quantity) || 0
                const factor = mat.unit === 'kg' || mat.unit === 'l' ? 1000 : 1
                const cost   = qty * factor * Number(mat.unitCost)
                const baseU  = mat.unit === 'kg' ? 'g' : mat.unit === 'l' ? 'ml' : mat.unit
                return (
                  <div key={item.rawMaterialId}
                    className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{mat.name}</p>
                      <p className="text-xs text-slate-400">{fmtBRL(Number(mat.unitCost))}/{baseU}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input type="number" min="0.01" step="0.01"
                        value={item.quantity}
                        onChange={e => updateQty(item.rawMaterialId, e.target.value)}
                        placeholder={`Qtd. (${mat.unit})`}
                        className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-center outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition" />
                      <span className="text-xs text-slate-400 w-6">{mat.unit}</span>
                      <span className="text-sm font-bold money text-emerald-600 min-w-[64px] text-right">{fmtBRL(cost)}</span>
                      <button type="button" onClick={() => removeItem(item.rawMaterialId)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition">×</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview de custo */}
      {preview.total > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-4">Preview de custo — atualizado em tempo real</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Ingredientes',    value: preview.ingredientCost },
              { label: 'Mão de obra',     value: preview.labor },
              { label: 'Embalagem',       value: preview.pack },
              { label: 'Outros',          value: preview.extra },
            ].map(row => (
              <div key={row.label} className="bg-white rounded-xl p-3 border border-blue-100">
                <p className="text-xs text-slate-400 mb-0.5">{row.label}</p>
                <p className="font-bold money text-slate-800 text-sm">{fmtBRL(row.value)}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
              <p className="text-xs text-slate-400 mb-1">Custo total (lote)</p>
              <p className="text-xl font-black money text-slate-800">{fmtBRL(preview.total)}</p>
            </div>
            <div className="bg-blue-500 rounded-xl p-4">
              <p className="text-xs text-blue-100 mb-1">Custo por unidade</p>
              <p className="text-xl font-black money text-white">{fmtBRL(preview.unitCost)}</p>
              <p className="text-xs text-blue-200 mt-1">÷ {yieldQty || 1} {yieldUnit}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary px-8">
          {saving ? 'Salvando e recalculando...' : '💾 Salvar ficha técnica'}
        </button>
      </div>
    </form>
  )
}
