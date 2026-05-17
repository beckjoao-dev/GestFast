'use client'

import { useState, useMemo } from 'react'
import type { RawMaterial } from '@/types'
import { fmtBRL, fmtQty } from '@/services/cost-calculator'


interface Props { initialItems: RawMaterial[] }

const UNITS = ['g','kg','ml','l','un','cx','pct'] as const
type Unit = typeof UNITS[number]

const CATEGORIES = ['Farináceos','Laticínios','Ovos','Açúcares','Gorduras','Líquidos','Embalagem','Outros']

const emptyForm = {
  name: '', category: '', unit: 'g' as Unit,
  totalCost: '', totalQty: '', minStockQty: '0',
  supplier: '', notes: '',
}

export default function StockClient({ initialItems }: Props) {
  const [items, setItems]       = useState<RawMaterial[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<RawMaterial | null>(null)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'all'|'low'|'ok'>('all')

  const costPreview = useMemo(() => {
    const c = parseFloat(form.totalCost)
    const q = parseFloat(form.totalQty)
    if (!c || !q || q <= 0) return null
    // Fator de conversão: kg→g×1000, l→ml×1000, resto×1
    const factor = form.unit === 'kg' || form.unit === 'l' ? 1000 : 1
    return c / (q * factor)
  }, [form.totalCost, form.totalQty, form.unit])

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
      const stockQty    = Number(i.stockQty)
      const minStock    = Number(i.minStockQty)
      const isLow       = minStock > 0 && stockQty <= minStock
      if (filter === 'low') return matchSearch && isLow
      if (filter === 'ok')  return matchSearch && !isLow
      return matchSearch
    })
  }, [items, search, filter])

  const totalValue = useMemo(() =>
    items.reduce((a, i) => a + Number(i.stockQty) * Number(i.unitCost), 0),
    [items]
  )
  const lowCount = useMemo(() =>
    items.filter(i => Number(i.minStockQty) > 0 && Number(i.stockQty) <= Number(i.minStockQty)).length,
    [items]
  )

  function openAdd() {
    setForm(emptyForm); setEditItem(null); setError(''); setShowForm(true)
  }
  function openEdit(item: RawMaterial) {
    setForm({
      name: item.name, category: item.category ?? '', unit: item.unit as Unit,
      totalCost: String(item.totalCost), totalQty: String(item.totalQty),
      minStockQty: String(item.minStockQty), supplier: item.supplier ?? '', notes: item.notes ?? '',
    })
    setEditItem(item); setError(''); setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true)
    const payload = {
      name: form.name.trim(), category: form.category || undefined, unit: form.unit,
      totalCost: parseFloat(form.totalCost), totalQty: parseFloat(form.totalQty),
      minStockQty: parseFloat(form.minStockQty) || 0,
      supplier: form.supplier || undefined, notes: form.notes || undefined,
    }
    try {
      if (editItem) {
        const res  = await fetch(`/api/raw-materials/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
        setItems(prev => prev.map(i => i.id === editItem.id ? json.data.item : i))
      } else {
        const res  = await fetch('/api/raw-materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
        setItems(prev => [json.data.item, ...prev])
      }
      setShowForm(false); setForm(emptyForm)
    } catch { setError('Erro de conexão') } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta matéria-prima?')) return
    const res = await fetch(`/api/raw-materials/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
  }

  const ic = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition'
  const lc = 'block text-xs font-semibold text-slate-600 mb-1.5'

  const baseUnitLabel = form.unit === 'kg' ? 'g' : form.unit === 'l' ? 'ml' : form.unit

  return (
    <div className="max-w-5xl space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total em estoque</p>
          <p className="text-2xl font-black text-slate-800">{fmtBRL(totalValue)}</p>
          <p className="text-xs text-slate-400 mt-1">{items.length} itens cadastrados</p>
        </div>
        <div className={`bg-white rounded-2xl border shadow-sm p-5 ${lowCount > 0 ? 'border-amber-200' : 'border-slate-100'}`}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Estoque baixo</p>
          <p className={`text-2xl font-black ${lowCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{lowCount}</p>
          <p className="text-xs text-slate-400 mt-1">{lowCount > 0 ? 'requerem reposição' : 'tudo ok'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Categorias</p>
          <p className="text-2xl font-black text-slate-800">{new Set(items.map(i => i.category).filter(Boolean)).size}</p>
          <p className="text-xs text-slate-400 mt-1">tipos diferentes</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ingrediente..." className={`${ic} max-w-xs`} />
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all','ok','low'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${filter === f ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}>
              {f === 'all' ? 'Todos' : f === 'ok' ? '✓ OK' : '⚠ Baixo'}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="ml-auto btn-primary">+ Adicionar</button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">{editItem ? 'Editar matéria-prima' : 'Nova matéria-prima'}</p>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>
          {error && <div className="mx-6 mt-4 alert-danger"><span>⚠️</span>{error}</div>}
          <form onSubmit={handleSave} className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={lc}>Nome *</label>
                <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Farinha de trigo" className={ic} />
              </div>
              <div>
                <label className={lc}>Categoria</label>
                <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} className={ic}>
                  <option value="">Selecione</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Preço pago (R$) *</label>
                <input required type="number" min="0.01" step="0.01" value={form.totalCost} onChange={e=>setForm(f=>({...f,totalCost:e.target.value}))} placeholder="Ex: 5.90" className={ic} />
                <p className="text-xs text-slate-400 mt-1">Valor total da embalagem</p>
              </div>
              <div>
                <label className={lc}>Quantidade *</label>
                <div className="flex gap-2">
                  <input required type="number" min="0.01" step="0.01" value={form.totalQty} onChange={e=>setForm(f=>({...f,totalQty:e.target.value}))} placeholder="Ex: 1000" className={ic} />
                  <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value as Unit}))} className="input w-20 shrink-0">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lc}>Estoque mínimo</label>
                <input type="number" min="0" step="0.01" value={form.minStockQty} onChange={e=>setForm(f=>({...f,minStockQty:e.target.value}))} placeholder="0" className={ic} />
                <p className="text-xs text-slate-400 mt-1">Alerta quando atingir</p>
              </div>
              <div>
                <label className={lc}>Fornecedor</label>
                <input value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} placeholder="Nome do fornecedor" className={ic} />
              </div>
            </div>
            {costPreview !== null && costPreview > 0 && (
              <div className="alert-blue mb-4">
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-bold text-blue-700">Custo calculado: {fmtBRL(costPreview)} por {baseUnitLabel}</p>
                  <p className="text-xs text-blue-500 font-normal mt-0.5">Calculado automaticamente a partir dos valores acima</p>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : editItem ? 'Salvar alterações' : 'Adicionar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Matérias-primas <span className="font-normal normal-case">({filtered.length})</span>
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-300">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-sm">Nenhuma matéria-prima encontrada.</p>
            <button onClick={openAdd} className="mt-4 btn-primary">Adicionar primeiro item</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Nome','Categoria','Estoque atual','Custo/unidade','Valor em estoque','Status',''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => {
                  const stockQty  = Number(item.stockQty)
                  const minStock  = Number(item.minStockQty)
                  const isLow     = minStock > 0 && stockQty <= minStock
                  const stockVal  = stockQty * Number(item.unitCost)
                  const baseUnit  = item.unit === 'kg' ? 'g' : item.unit === 'l' ? 'ml' : item.unit
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{item.name}</td>
                      <td className="px-5 py-3.5 text-slate-500">{item.category ?? '—'}</td>
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-700">{fmtQty(stockQty, item.unit)}</td>
                      <td className="px-5 py-3.5 font-mono font-medium text-blue-600">{fmtBRL(Number(item.unitCost))}/{baseUnit}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{fmtBRL(stockVal)}</td>
                      <td className="px-5 py-3.5">
                        {isLow
                          ? <span className="badge-amber">⚠ Baixo</span>
                          : <span className="badge-green">✓ OK</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(item)} className="btn-outline btn-sm text-xs">Editar</button>
                          <button onClick={() => handleDelete(item.id)} className="btn-danger-soft text-xs">Remover</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
