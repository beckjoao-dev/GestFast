'use client'

import { useState } from 'react'
import type { Ingredient } from '@prisma/client'

interface Props { initialIngredients: Ingredient[] }

const UNITS = [
  { value: 'g',  example: 'Ex: 1000g de farinha' },
  { value: 'kg', example: 'Ex: 1kg de açúcar' },
  { value: 'ml', example: 'Ex: 500ml de leite' },
  { value: 'l',  example: 'Ex: 1l de óleo' },
  { value: 'un', example: 'Ex: 12 ovos' },
] as const

type Unit = typeof UNITS[number]['value']

const emptyForm = { name: '', totalCost: '', totalQty: '', unit: 'g' as Unit }

function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export default function IngredientManager({ initialIngredients }: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)
  const [form, setForm]               = useState(emptyForm)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  const costPerUnit = form.totalCost && form.totalQty && parseFloat(form.totalQty) > 0
    ? parseFloat(form.totalCost) / parseFloat(form.totalQty)
    : null

  const selectedUnit = UNITS.find(u => u.value === form.unit)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    const cost = parseFloat(form.totalCost)
    const qty  = parseFloat(form.totalQty)
    if (!form.name.trim())  return setError('Digite o nome do ingrediente.')
    if (!cost || cost <= 0) return setError('Digite o preço que você pagou.')
    if (!qty  || qty  <= 0) return setError('Digite a quantidade que você comprou.')
    setSaving(true)
    try {
      const res  = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), unit: form.unit, totalCost: cost, totalQty: qty }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
      setIngredients(prev => [json.data.ingredient, ...prev])
      setForm(emptyForm)
      setSuccess(`"${json.data.ingredient.name}" adicionado com sucesso!`)
      setTimeout(() => setSuccess(''), 4000)
    } catch { setError('Erro ao salvar. Tente novamente.') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover "${name}"? Produtos que usam este ingrediente podem ser afetados.`)) return
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE' })
      if (res.ok) setIngredients(prev => prev.filter(i => i.id !== id))
      else { const j = await res.json(); alert(j.error ?? 'Erro ao remover.') }
    } catch { alert('Erro ao remover.') }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Formulário */}
      <div className="card-p">
        <h2 className="font-bold text-slate-700 mb-0.5">Adicionar ingrediente</h2>
        <p className="text-sm text-slate-400 mb-5">
          Preencha os dados do que você compra. O custo é calculado automaticamente.
        </p>

        {error   && <div className="alert-danger mb-4"><span>⚠️</span>{error}</div>}
        {success && <div className="alert-green  mb-4"><span>✅</span>{success}</div>}

        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nome do ingrediente *
            </label>
            <input required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Farinha de trigo, Açúcar, Leite..."
              className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Preço que você pagou (R$) *
              </label>
              <input type="number" required min="0.01" step="0.01"
                value={form.totalCost}
                onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
                placeholder="Ex: 5.90" className="input" />
              <p className="hint">Quanto custou a embalagem inteira</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Quantidade que veio *
              </label>
              <div className="flex gap-2">
                <input type="number" required min="0.01" step="0.01"
                  value={form.totalQty}
                  onChange={e => setForm(f => ({ ...f, totalQty: e.target.value }))}
                  placeholder="Ex: 1000" className="input" />
                <select value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value as Unit }))}
                  className="input w-20 shrink-0">
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.value}</option>)}
                </select>
              </div>
              <p className="hint">{selectedUnit?.example}</p>
            </div>
          </div>

          {/* Preview */}
          {costPerUnit !== null && costPerUnit > 0 && (
            <div className="alert-blue">
              <span className="text-xl shrink-0">💡</span>
              <div>
                <p className="font-bold text-blue-700">
                  Custo por {form.unit}: {fmtBRL(costPerUnit)}
                </p>
                <p className="text-xs text-blue-500 mt-0.5 font-normal">
                  Calculado automaticamente
                </p>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Salvando...' : 'Salvar ingrediente'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        <div className="section-header flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Seus ingredientes{' '}
            <span className="font-normal normal-case">({ingredients.length})</span>
          </p>
        </div>

        {ingredients.length === 0 ? (
          <div className="py-14 text-center text-slate-300">
            <div className="text-4xl mb-2">🌿</div>
            <p className="text-sm">Nenhum ingrediente ainda. Adicione o primeiro acima!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {ingredients.map(ing => (
              <div key={ing.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{ing.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Comprou {ing.totalQty}{ing.unit} por {fmtBRL(ing.totalCost)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold money text-blue-600">
                    {fmtBRL(ing.totalCost / ing.totalQty)}
                  </p>
                  <p className="text-xs text-slate-400">por {ing.unit}</p>
                </div>
                <button onClick={() => handleDelete(ing.id, ing.name)}
                  className="btn-danger-soft shrink-0">
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
