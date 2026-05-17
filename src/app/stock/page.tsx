import AppShell from '@/components/AppShell'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import StockClient from '@/components/StockClient'

export default async function StockPage() {
  const session = getCurrentUser()
  if (!session) redirect('/login')

  const rawMaterials = await prisma.rawMaterial.findMany({
    where: { userId: session.userId },
    orderBy: { name: 'asc' },
  })

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">📦 Estoque</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Matérias-primas e ingredientes. O sistema calcula custos automaticamente.
          </p>
        </div>
        <StockClient initialItems={rawMaterials} />
      </div>
    </AppShell>
  )
}
