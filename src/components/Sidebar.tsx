'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props { role: 'ADMIN' | 'USER' }

const nav = [
  { href: '/dashboard',   label: 'Dashboard',     icon: '📊', desc: 'Visão geral' },
  { href: '/stock',       label: 'Estoque',        icon: '📦', desc: 'Matérias-primas' },
  { href: '/products',    label: 'Produtos',       icon: '🎂', desc: 'Catálogo e preços' },
  { href: '/production',  label: 'Produção',       icon: '⚙️',  desc: 'Registrar produção' },
  { href: '/costs',       label: 'Custos fixos',   icon: '⚡', desc: 'Gás, energia, embalagem' },
  { href: '/simulation',  label: 'Simulador',      icon: '💡', desc: 'Simular preços' },
]

export default function Sidebar({ role }: Props) {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/me', { method: 'POST' })
    window.location.href = '/login'
  }

  const allNav = role === 'ADMIN'
    ? [...nav, { href: '/admin', label: 'Usuários', icon: '👥', desc: 'Gerenciar acessos' }]
    : nav

  return (
    <aside className="w-[220px] min-w-[220px] h-screen flex flex-col bg-white border-r border-slate-100">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm shadow-blue-200 group-hover:bg-blue-600 transition">
            G
          </div>
          <div>
            <div className="text-sm font-black text-slate-800 leading-tight tracking-tight">GestFast</div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide">Gestão artesanal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {allNav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
                active
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">{item.label}</div>
                <div className={cn('text-[11px] leading-tight mt-0.5 truncate', active ? 'text-blue-100' : 'text-slate-400')}>
                  {item.desc}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition font-medium">
          <span className="text-sm">→</span>
          Sair da conta
        </button>
      </div>
    </aside>
  )
}
