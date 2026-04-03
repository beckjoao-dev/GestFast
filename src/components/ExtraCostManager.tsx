'use client'

import { useState, useMemo } from 'react'

export interface ExtraCostItem {
  id:        string
  name:      string
  category:  string
  totalCost: number
  totalQty:  number
  unit:      string
  createdAt: string | Date
}

interface Props { initialCosts: ExtraCostItem[] }

const CATEGORIES = [
  { value: 'energy',    label: 'Energia elétrica', icon: '⚡', example: 'Conta de luz do mês' },
  { value: 'gas',       label: 'Gás',               icon: '🔥', example: 'Botijão de gás 13kg' },
  { value: 'packaging', label: 'Embalagem',          icon: '📦', example: 'Caixas, saquinhos, fitas' },
  { value: 'labor',     label: 'Mão de obra',        icon: '👤', example: 'Ajudante, entregador' },
  { value: 'other',     label: 'Outros',             icon: '➕', example: 'Taxa de entrega, etc.' },
] as const

type Category = typeof CATEGORIES[number]['value']

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  energy:    { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100',  iconBg: 'bg-amber-100'  },
  gas:       { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', iconBg: 'bg-orange-100' },
  packaging: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',   iconBg: 'bg-blue-100'   },
  labor:     { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', iconBg: 'bg-purple-100' },
  other:     { bg: 'bg-slate-50',  text: 'text-slate-700',  border: 'border-slate-100',  iconBg: 'bg-slate-100'  },
}

const emptyForm = { name: '', category: 'energy' as Category, totalCost: '', totalQty: '', unit: 'receitas' }

function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export default function ExtraCostManager({ initialCosts }: Props) {
  const [costs, setCosts]       = useState<ExtraCostItem[]>(initialCosts)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [showForm, setShowForm] = useState(false)

  const costPerUse = useMemo(() => {
    const c = parseFloat(form.totalCost)
    const q = parseFloat(form.totalQty)
    if (!c || !q || c <= 0 || q <= 0) return null
    return c / q
  }, [form.totalCost, form.totalQty])

  const totalMonthlyCost = useMemo(() => costs.reduce((a, c) => a + c.totalCost, 0), [costs])
  const selectedCat = CATEGORIES.find(c => c.value === form.category)!

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    const cost = parseFloat(form.totalCost)
    const qty  = parseFloat(form.totalQty)
    if (!form.name.trim()) return setError('Digite o nome deste custo.')
    if (!cost || cost <= 0) return setError('Digite o valor que você pagou.')
    if (!qty  || qty  <= 0) return setError('Digite quantas vezes esse custo é usado.')
    setSaving(true)
    try {
      const res  = await fetch('/api/extra-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), category: form.category,
          totalCost: cost, totalQty: qty,
          unit: form.unit.trim() || 'usos',
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
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

      {/* Stats */}
      {costs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total cadastrado',  value: fmtBRL(totalMonthlyCost), sub: 'em custos operacionais' },
            { label: 'Itens cadastrados', value: String(costs.length),      sub: 'categorias de custo' },
            { label: 'Categorias',        value: String(new Set(costs.map(c => c.category)).size), sub: `de ${CATEGORIES.length} disponíveis` },
          ].map(s => (
            <div key={s.label} className="card-p">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 money">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Botão + feedback */}
      <div className="flex items-center justify-between">
        {success
          ? <div className="alert-green text-sm flex-1 mr-4"><span>✅</span>{success}</div>
          : <div />
        }
        {!showForm && (
          <button onClick={() => { setShowForm(true); setError('') }} className="btn-primary shrink-0">
            + Adicionar custo
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card overflow-hidden">
          {/* Seletor de categoria */}
          <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Selecione a categoria</p>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => {
                const style    = CATEGORY_STYLES[cat.value]
                const isActive = form.category === cat.value
                return (
                  <button key={cat.value} type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition ${
                      isActive
                        ? `${style.bg} ${style.text} ${style.border} shadow-sm`
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}>
                    <span>{cat.icon}</span>{cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={handleAdd} className="p-6 space-y-5">
            {error && (
              <div className="alert-danger"><span>⚠️</span>{error}</div>
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

            {/* Calculadora */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Calculadora de custo por uso
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quanto você pagou? (R$) *</label>
                  <input type="number" required min="0.01" step="0.01"
                    value={form.totalCost}
                    onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
                    placeholder="Ex: 120,00" className="input" />
                  <p className="hint">
                    {form.category === 'energy'    && 'Valor total da conta de luz'}
                    {form.category === 'gas'        && 'Valor pago pelo botijão'}
                    {form.category === 'packaging'  && 'Valor pago pelo pacote de embalagens'}
                    {form.category === 'labor'      && 'Valor pago ao colaborador'}
                    {form.category === 'other'      && 'Valor total gasto com este item'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantas vezes ele rende? *</label>
                  <div className="flex gap-2">
                    <input type="number" required min="0.01" step="0.01"
                      value={form.totalQty}
                      onChange={e => setForm(f => ({ ...f, totalQty: e.target.value }))}
                      placeholder="Ex: 30" className="input" />
                    <input value={form.unit}
                      onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder="usos" className="input w-24 shrink-0" />
                  </div>
                  <p className="hint">
                    {form.category === 'energy'   && 'Horas ou receitas produzidas no mês'}
                    {form.category === 'gas'       && 'Quantas receitas esse botijão rende'}
                    {form.category === 'packaging' && 'Quantas unidades vieram na embalagem'}
                    {form.category === 'labor'     && 'Horas ou receitas produzidas'}
                    {form.category === 'other'     && 'Quantas vezes será usado este custo'}
                  </p>
                </div>
              </div>

              {/* Preview calculado */}
              <div className={`rounded-xl p-4 border transition-all ${
                costPerUse !== null ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">
                      Custo calculado por {form.unit || 'uso'}
                    </p>
                    <p className="text-2xl font-black text-blue-700 money mt-1">
                      {costPerUse !== null ? fmtBRL(costPerUse) : 'R$ —'}
                    </p>
                  </div>
                  <span className="text-3xl opacity-20 select-none">🧮</span>
                </div>
                {costPerUse !== null && (
                  <p className="text-xs text-blue-500 mt-2">
                    Este valor será somado ao custo de cada produto que usar este insumo.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); setError('') }}
                className="btn-outline">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar custo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista agrupada */}
      {costs.length === 0 && !showForm ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="font-bold text-slate-700 mb-2">Nenhum custo cadastrado ainda</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-5">
            Cadastre energia, gás e embalagens. O sistema distribui automaticamente em cada produto.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Adicionar primeiro custo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const items = costs.filter(c => c.category === cat.value)
            if (items.length === 0) return null
            const style    = CATEGORY_STYLES[cat.value]
            const totalCat = items.reduce((a, c) => a + c.totalCost, 0)
            return (
              <div key={cat.value} className="card overflow-hidden">
                <div className={`flex items-center justify-between px-5 py-3.5 border-b ${style.bg} ${style.border}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${style.iconBg}`}>
                      {cat.icon}
                    </span>
                    <span className={`font-bold text-sm ${style.text}`}>{cat.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.bg} ${style.text} border ${style.border}`}>
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                  <span className={`text-sm font-bold money ${style.text}`}>{fmtBRL(totalCat)}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map(item => {
                    const perUse = item.totalCost / item.totalQty
                    return (
                      <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {fmtBRL(item.totalCost)} ÷ {item.totalQty} {item.unit}{' '}
                            = <strong className="text-slate-600">{fmtBRL(perUse)} por {item.unit.replace(/s$/, '')}</strong>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold money text-blue-600">{fmtBRL(perUse)}</p>
                          <p className="text-xs text-slate-400">por {item.unit.replace(/s$/, '')}</p>
                        </div>
                        <button onClick={() => handleDelete(item.id, item.name)}
                          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition">
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
