import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminUsersClient from '../../../components/AdminUsersClient'

export default async function AdminPage() {
  const session = getCurrentUser()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN') redirect('/dashboard')
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">👥 Gerenciar usuários</h1>
        <p className="text-slate-400 text-sm mt-1">Crie e gerencie os acessos da plataforma.</p>
      </div>
      <AdminUsersClient initialUsers={users} currentUserId={session.userId} />
    </div>
  )
}
