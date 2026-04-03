'use client'

import { useState, useMemo } from 'react'

export interface ExtraCostItem {
  id: string
  name: string
  category: string
  totalCost: number
  totalQty: number
  unit: string
  createdAt: string | Date
}

interface Props { initialCosts: ExtraCostItem[] }

const CATEGORIES = [
  { value: 'energy',    label: 'Energia elétrica', icon: '⚡', color: 'amber',  example: 'Conta de luz do mês' },
  { value: 'gas',       label: 'Gás',               icon: '🔥', color: 'orange', example: 'Botijão de gás 13kg' },
  { value: 'packaging', label: 'Embalagem',          icon: '📦', color: 'blue',   example: 'Caixas, saquinhos, fitas' },
  { value: 'labor',     label: 'Mão de obra',        icon: '👤', color: 'purple', example: 'Ajudante, entregador' },
  { value: 'other',     label: 'Outros',             icon: '➕', color: 'slate',  example: 'Taxa de entrega, etc.' },
] as const

type Category = typeof CATEGORIES[number]['value']

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  energy:    { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100', iconBg: 'bg-amber-100' },
  gas:       { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100',iconBg: 'bg-orange-100'},
  packaging: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',  iconBg: 'bg-blue-100'  },
  labor:     { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100',iconBg: 'bg-purple-100'},
  other:     { bg: 'bg-slate-50',  text: 'text-slate-700',  border: 'border-slate-100', iconBg: 'bg-slate-100' },
}

const emptyForm = { name: '', category: 'energy' as Category, totalCost: '', totalQty: '', unit: 'receitas' }

export default function ExtraCostManager({ initialCosts }: Props) {
  const [costs, setCosts]     = useState<ExtraCostItem[]>(initialCosts)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  function fmtBRL(n: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  // Custo por uso calculado em tempo real
  const costPerUse = useMemo(() => {
    const c = parseFloat(form.totalCost)
    const q = parseFloat(form.totalQty)
    if (!c || !q || c <= 0 || q <= 0) return null
    return c / q
  }, [form.totalCost, form.totalQty])

  // Agrupar por categoria para exibição
  const grouped = useMemo(() => {
    return CATEGORIES.map(cat => ({
      ...cat,
      items: costs.filter(c => c.category === cat.value),
    })).filter(g => g.items.length > 0 || activeCategory === g.value)
  }, [costs, activeCategory])

  const totalMonthlyCost = useMemo(() => costs.reduce((a, c) => a + c.totalCost, 0), [costs])

  const selectedCat = CATEGORIES.find(c => c.value === form.category)!

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    const cost = parseFloat(form.totalCost)
    const qty  = parseFloat(form.totalQty)
    if (!form.name.trim()) return setError('Digite o nome deste custo.')
    if (!cost || cost <= 0)  return setError('Digite o valor que você pagou.')
    if (!qty  || qty  <= 0)  return setError('Digite quantas vezes esse custo é usado.')
    setSaving(true)
    try {
      const res  = await fetch('/api/extra-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), category: form.category, totalCost: cost, totalQty: qty, unit: form.unit.trim() || 'usos' }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setCosts(prev => [json.data.extraCost, ...prev])
      setForm(emptyForm)
      setShowForm(false)
      setSuccess(`"${json.data.extraCost.name}" adicionado! Custo por uso: ${fmtBRL(cost / qty)}`)
      setTimeout(() => setSuccess(''), 5000)
    } catch { setError('Erro ao salvar. Tente novamente.') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover "${name}"?`)) return
    try {
      const res = await fetch(`/api/extra-costs/${id}`, { method: 'DELETE' })
      if (res.ok) setCosts(prev => prev.filter(c => c.id !== id))
      else alert('Erro ao remover.')
    } catch { alert('Erro ao remover.') }
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header stats */}
      {costs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Total cadastrado</p>
            <p className="text-2xl font-bold text-slate-800 font-mono">{fmtBRL(totalMonthlyCost)}</p>
            <p className="text-xs text-slate-400 mt-1">em custos operacionais</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Itens cadastrados</p>
            <p className="text-2xl font-bold text-slate-800">{costs.length}</p>
            <p className="text-xs text-slate-400 mt-1">categorias de custo</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Categorias</p>
            <p className="text-2xl font-bold text-slate-800">
              {new Set(costs.map(c => c.category)).size}
            </p>
            <p className="text-xs text-slate-400 mt-1">de {CATEGORIES.length} disponíveis</p>
          </div>
        </div>
      )}

      {/* Botão + feedback */}
      <div className="flex items-center justify-between">
        <div>
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-2.5 rounded-xl">
              <span>✅</span> {success}
            </div>
          )}
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setError('') }}
            className="btn-primary flex items-center gap-2">
            <span className="text-base">+</span> Adicionar custo
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Seletor de categoria */}
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Selecione a categoria
            </p>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => {
                const style = CATEGORY_STYLES[cat.value]
                const isActive = form.category === cat.value
                return (
                  <button key={cat.value} type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition ${
                      isActive
                        ? `${style.bg} ${style.text} ${style.border} shadow-sm`
                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                    }`}>
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleAdd} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {selectedCat.icon} Nome deste custo *
              </label>
              <input required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={selectedCat.example}
                className="input" />
            </div>

            {/* Calculadora de custo por uso */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Calculadora de custo por uso
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Quanto você pagou? (R$) *
                  </label>
                  <input type="number" required min="0.01" step="0.01"
                    value={form.totalCost}
                    onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
                    placeholder="Ex: 120,00"
                    className="input" />
                  <p className="text-xs text-slate-400 mt-1">
                    {form.category === 'energy' && 'Valor total da conta de luz'}
                    {form.category === 'gas' && 'Valor pago no botijão/gás natural'}
                    {form.category === 'packaging' && 'Valor pago pelo pacote/caixa de embalagens'}
                    {form.category === 'labor' && 'Valor pago ao colaborador'}
                    {form.category === 'other' && 'Valor total gasto com este item'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Quantas vezes ele rende? *
                  </label>
                  <div className="flex gap-2">
                    <input type="number" required min="0.01" step="0.01"
                      value={form.totalQty}
                      onChange={e => setForm(f => ({ ...f, totalQty: e.target.value }))}
                      placeholder="Ex: 30"
                      className="input" />
                    <input
                      value={form.unit}
                      onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder="usos"
                      className="input w-24 shrink-0"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {form.category === 'energy' && 'Horas ou receitas que produziu no mês'}
                    {form.category === 'gas' && 'Quantas receitas esse botijão rende'}
                    {form.category === 'packaging' && 'Quantas unidades vieram na embalagem'}
                    {form.category === 'labor' && 'Quantas horas ou receitas foram produzidas'}
                    {form.category === 'other' && 'Quantas vezes será usado este custo'}
                  </p>
                </div>
              </div>

              {/* Preview do custo calculado */}
              <div className={`rounded-xl p-4 border transition-all ${
                costPerUse !== null
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-white border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      Custo calculado por {form.unit || 'uso'}
                    </p>
                    <p className="text-2xl font-bold text-blue-700 font-mono mt-1">
                      {costPerUse !== null ? fmtBRL(costPerUse) : 'R$ —'}
                    </p>
                  </div>
                  <div className="text-3xl opacity-20 select-none">🧮</div>
                </div>
                {costPerUse !== null && (
                  <p className="text-xs text-blue-500 mt-2">
                    Este valor será somado automaticamente ao custo de cada produto que usar este insumo.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); setError('') }}
                className="btn-outline">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar custo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista agrupada por categoria */}
      {costs.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="font-semibold text-slate-700 mb-2">Nenhum custo cadastrado ainda</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
            Cadastre seus custos operacionais — energia, gás, embalagens — e o sistema os distribui automaticamente em cada produto.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
            + Adicionar primeiro custo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const items = costs.filter(c => c.category === cat.value)
            if (items.length === 0) return null
            const style = CATEGORY_STYLES[cat.value]
            const totalCat = items.reduce((a, c) => a + c.totalCost, 0)
            return (
              <div key={cat.value} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Cabeçalho da categoria */}
                <div className={`flex items-center justify-between px-5 py-3.5 border-b ${style.bg} ${style.border}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${style.iconBg}`}>
                      {cat.icon}
                    </span>
                    <span className={`font-semibold text-sm ${style.text}`}>{cat.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text} border ${style.border}`}>
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold font-mono ${style.text}`}>{fmtBRL(totalCat)}</span>
                </div>

                {/* Itens */}
                <div className="divide-y divide-slate-50">
                  {items.map(item => {
                    const perUse = item.totalCost / item.totalQty
                    return (
                      <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {fmtBRL(item.totalCost)} ÷ {item.totalQty} {item.unit} = <strong className="text-slate-600">{fmtBRL(perUse)} por {item.unit.replace(/s$/, '')}</strong>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold font-mono text-blue-600">{fmtBRL(perUse)}</p>
                          <p className="text-xs text-slate-400">por {item.unit.replace(/s$/, '')}</p>
                        </div>
                        <button onClick={() => handleDelete(item.id, item.name)}
                          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition text-base">
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
