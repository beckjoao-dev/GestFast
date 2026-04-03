'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">G</div>
          <span className="text-xl font-semibold tracking-tight">GestFast</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-lg font-semibold mb-1">Criar conta grátis</h1>
          <p className="text-sm text-white/40 mb-6">Comece a precificar seus produtos hoje.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Nome</label>
              <input
                required
                placeholder="Seu nome"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Senha</label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-sm transition"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-white/40">
            Já tem conta?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 transition">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
