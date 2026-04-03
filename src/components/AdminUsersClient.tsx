'use client'

import { useState } from 'react'

interface User { id: string; name: string; email: string; role: 'ADMIN' | 'USER'; createdAt: string | Date }
interface Props { initialUsers: User[]; currentUserId: string }

const emptyForm = { name: '', email: '', password: '', role: 'USER' as 'ADMIN' | 'USER' }

export default function AdminUsersClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers]     = useState<User[]>(initialUsers)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)

  function fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString('pt-BR')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (form.password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setUsers(prev => [json.data.user, ...prev])
      setForm(emptyForm); setShowForm(false)
      setSuccess(`Usuário "${json.data.user.name}" criado com sucesso!`)
      setTimeout(() => setSuccess(''), 5000)
    } catch { setError('Erro ao criar usuário.') }
    finally { setSaving(false) }
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Excluir o usuário "${name}"? Todos os dados serão apagados.`)) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId))
      else { const j = await res.json(); alert(j.error ?? 'Erro ao excluir.') }
    } catch { alert('Erro ao excluir.') }
  }

  const ic = 'input'
  const lc = 'block text-sm font-medium text-slate-700 mb-1.5'

  return (
    <div className="max-w-2xl space-y-5">
      {!showForm && (
        <div className="flex justify-end">
          <button onClick={() => { setShowForm(true); setError('') }} className="btn-primary">
            + Criar novo usuário
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-xl">
          ✅ {success}
        </div>
      )}

      {showForm && (
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Novo usuário</h2>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="text-slate-400 hover:text-slate-600 text-sm transition">✕ Fechar</button>
          </div>
          {error && <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">⚠️ {error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lc}>Nome completo *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Maria Silva" className={ic} />
              </div>
              <div>
                <label className={lc}>E-mail *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="maria@email.com" className={ic} />
              </div>
              <div>
                <label className={lc}>Senha inicial *</label>
                <input required type="password" minLength={8} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres" className={ic} />
              </div>
              <div>
                <label className={lc}>Tipo de acesso</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'ADMIN' | 'USER' }))}
                  className={ic}>
                  <option value="USER">Usuário comum</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setError('') }} className="btn-outline">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="section-card">
        <h2 className="font-semibold text-slate-700 mb-4">
          Usuários cadastrados
          <span className="ml-2 text-sm font-normal text-slate-400">({users.length})</span>
        </h2>
        {users.length === 0 ? (
          <div className="text-center py-10 text-slate-300">
            <div className="text-4xl mb-2">👤</div>
            <p className="text-sm">Nenhum usuário cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="font-medium text-slate-700">
                    {u.name}
                    {u.id === currentUserId && <span className="ml-2 text-xs text-slate-400">(você)</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{u.email} · desde {fmtDate(u.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border
                    ${u.role === 'ADMIN'
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {u.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                  </span>
                  {u.id !== currentUserId && (
                    <button onClick={() => handleDelete(u.id, u.name)} className="btn-danger-soft">
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
