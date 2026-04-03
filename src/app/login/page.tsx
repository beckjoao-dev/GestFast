'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setStatus('loading')
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'E-mail ou senha incorretos.'); setStatus('idle'); return }
      setStatus('success')
      window.location.replace('/dashboard')
    } catch { setError('Erro de conexão. O servidor está rodando?'); setStatus('idle') }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500 shadow-lg shadow-blue-200 mb-4">
            <span className="text-white text-2xl font-black">G</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">GestFast</h1>
          <p className="text-slate-400 text-sm mt-1">Descubra quanto você realmente lucra</p>
        </div>

        <div className="card p-7">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Entrar na conta</h2>
          <p className="text-sm text-slate-400 mb-6">Acesse seu painel de lucros</p>

          {error && (
            <div className="alert-danger mb-5">
              <span>⚠️</span> {error}
            </div>
          )}
          {status === 'success' && (
            <div className="alert-green mb-5">
              <span>✅</span> Login realizado! Entrando...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail</label>
              <input type="email" required autoFocus autoComplete="email"
                placeholder="seu@email.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                disabled={status !== 'idle'} className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
              <input type="password" required autoComplete="current-password"
                placeholder="Sua senha" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                disabled={status !== 'idle'} className="input" />
            </div>
            <button type="submit" disabled={status !== 'idle'}
              className="btn-primary w-full py-3 mt-1 font-bold">
              {status === 'loading' && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {status === 'idle' ? 'Entrar' : status === 'loading' ? 'Verificando...' : 'Entrando...'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-400 mt-5">
          Acesso restrito — solicite ao administrador
        </p>
      </div>
    </div>
  )
}
