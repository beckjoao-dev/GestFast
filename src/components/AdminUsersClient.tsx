'use client'

import { useState } from 'react'

interface User {
  id:        string
  name:      string
  email:     string
  role:      'ADMIN' | 'USER'
  createdAt: string | Date
}

interface Props {
  initialUsers:  User[]
  currentUserId: string
}

const emptyForm = { name: '', email: '', password: '', role: 'USER' as 'ADMIN' | 'USER' }

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function AdminUsersClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers]       = useState<User[]>(initialUsers)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      if (!res.ok) { setError(json.error ?? 'Erro ao criar'); return }
      setUsers(prev => [json.data.user, ...prev])
      setForm(emptyForm); setShowForm(false)
      setSuccess(`Usuário "${json.data.user.name}" criado com sucesso!`)
      setTimeout(() => setSuccess(''), 5000)
    } catch { setError('Erro ao criar usuário.') }
    finally { setSaving(false) }
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Excluir "${name}"? Todos os dados serão apagados.`)) return
    setDeletingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId))
      else { const j = await res.json(); alert(j.error ?? 'Erro ao excluir.') }
    } catch { alert('Erro ao excluir.') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="max-w-2xl space-y-5">

      <div className="flex items-center justify-between">
        {success
          ? <div className="alert-green flex-1 mr-4"><span>✅</span>{success}</div>
          : <div />
        }
        {!showForm && (
          <button onClick={() => { setShowForm(true); setError('') }} className="btn-primary shrink-0">
            + Criar usuário
          </button>
        )}
      </div>

      {showForm && (
        <div className="card overflow-hidden">
          <div className="section-header flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Novo usuário</p>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="text-slate-400 hover:text-slate-600 text-sm transition">✕</button>
          </div>
          {error && <div className="alert-danger mx-6 mt-4"><span>⚠️</span>{error}</div>}
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome *</label>
                <input required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="João da Silva" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail *</label>
                <input required type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="joao@email.com" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha *</label>
                <input required type="password" minLength={8} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de acesso</label>
                <select value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as 'ADMIN' | 'USER' }))}
                  className="input">
                  <option value="USER">Usuário comum</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setShowForm(false); setError('') }} className="btn-outline">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="section-header">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Usuários cadastrados{' '}
            <span className="font-normal normal-case">({users.length})</span>
          </p>
        </div>
        {users.length === 0 ? (
          <div className="py-14 text-center text-slate-300">
            <div className="text-4xl mb-2">👤</div>
            <p className="text-sm">Nenhum usuário.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                    {u.id === currentUserId && (
                      <span className="badge-blue text-[10px]">você</span>
                    )}
                    <span className={u.role === 'ADMIN' ? 'badge-blue' : 'badge-amber'}>
                      {u.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{u.email} · desde {fmtDate(u.createdAt)}</p>
                </div>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    disabled={deletingId === u.id}
                    className="btn-danger-soft shrink-0 disabled:opacity-50">
                    {deletingId === u.id ? '...' : 'Excluir'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
