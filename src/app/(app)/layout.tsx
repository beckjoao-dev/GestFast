import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = getCurrentUser()
  if (!session) redirect('/login')
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={session.role} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
