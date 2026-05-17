import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface Props {
  children:  React.ReactNode
  adminOnly?: boolean
}

export default async function AppShell({ children, adminOnly = false }: Props) {
  const session = getCurrentUser()
  if (!session) redirect('/login')
  if (adminOnly && session.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={session.role as 'ADMIN' | 'USER'} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
