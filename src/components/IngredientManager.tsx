'use client'

import { useState } from 'react'
import type { Ingredient } from '@prisma/client'

interface Props { initialIngredients: Ingredient[] }

const UNITS = [
  { value: 'g',  label: 'Gramas (g)',     example: 'Ex: 1000g de farinha' },
  { value: 'kg', label: 'Quilos (kg)',     example: 'Ex: 1kg de açúcar' },
  { value: 'ml', label: 'Mililitros (ml)', example: 'Ex: 500ml de leite' },
  { value: 'l',  label: 'Litros (l)',      example: 'Ex: 1l de óleo' },
  { value: 'un', label: 'Unidades (un)',   example: 'Ex: 12 ovos' },
] as const
type Unit = typeof UNITS[number]['value']

const empty = { name: '', totalCost: '', totalQty: '', unit: 'g' as Unit }

export default function IngredientManager({ initialIngredients }: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)
  const [form, setForm]   = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  function fmtBRL(n: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  const costPerUnit = form.totalCost && form.totalQty
    ? parseFloat(form.totalCost) / parseFloat(form.totalQty)
    : null

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    const cost = parseFloat(form.totalCost)
    const qty  = parseFloat(form.totalQty)
    if (!form.name.trim()) return setError('Digite o nome do ingrediente.')
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
      if (!res.ok) { setError(json.error); return }
      setIngredients(prev => [json.data.ingredient, ...prev])
      setForm(empty)
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

  const selectedUnit = UNITS.find(u => u.value === form.unit)

  return (
    <div className="max-w-2xl space-y-6">

      {/* Formulário de adição */}
      <div className="card-p">
        <h2 className="font-semibold text-slate-700 mb-1">➕ Adicionar ingrediente</h2>
        <p className="text-sm text-slate-400 mb-5">
          Preencha os dados do que você compra. O sistema calcula o custo automaticamente.
        </p>

        {error   && <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">⚠️ {error}</div>}
        {success && <div className="mb-4 bg-green-50 border border-green-100 text-green-600 text-sm px-4 py-3 rounded-xl">✅ {success}</div>}

        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome do ingrediente *
            </label>
            <input
              required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Farinha de trigo, Açúcar, Leite..."
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Preço que você pagou (R$) *
              </label>
              <input
                type="number" required min="0.01" step="0.01"
                value={form.totalCost}
                onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))}
                placeholder="Ex: 5.90"
                className="input"
              />
              <p className="hint">Quanto custou a embalagem inteira</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Quantidade que veio *
              </label>
              <div className="flex gap-2">
                <input
                  type="number" required min="0.01" step="0.01"
                  value={form.totalQty}
                  onChange={e => setForm(f => ({ ...f, totalQty: e.target.value }))}
                  placeholder="Ex: 1000"
                  className="input"
                />
                <select
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value as Unit }))}
                  className="input w-20 shrink-0"
                >
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.value}</option>)}
                </select>
              </div>
              <p className="hint">{selectedUnit?.example}</p>
            </div>
          </div>

          {/* Preview do custo por unidade */}
          {costPerUnit !== null && costPerUnit > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <div className="text-sm font-medium text-blue-700">
                  Custo por {form.unit}: <strong>{fmtBRL(costPerUnit)}</strong>
                </div>
                <div className="text-xs text-blue-500 mt-0.5">
                  Calculado automaticamente a partir dos valores acima
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Salvando...' : 'Salvar ingrediente'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="card-p">
        <h2 className="font-semibold text-slate-700 mb-4">
          Seus ingredientes
          <span className="ml-2 text-sm font-normal text-slate-400">({ingredients.length})</span>
        </h2>

        {ingredients.length === 0 ? (
          <div className="text-center py-10 text-slate-300">
            <div className="text-4xl mb-2">🌿</div>
            <p className="text-sm">Nenhum ingrediente ainda. Adicione o primeiro acima!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ingredients.map(ing => (
              <div key={ing.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-medium text-slate-700">{ing.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Comprou: {ing.totalQty}{ing.unit} por {fmtBRL(ing.totalCost)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600 font-mono">
                      {fmtBRL(ing.totalCost / ing.totalQty)}
                    </div>
                    <div className="text-xs text-slate-400">por {ing.unit}</div>
                  </div>
                  <button onClick={() => handleDelete(ing.id, ing.name)} className="btn-danger-soft">
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
