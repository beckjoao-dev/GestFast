import AppShell from '@/components/AppShell'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProductionClient from '@/components/ProductionClient'

export default async function ProductionPage() {
  const session = getCurrentUser()
  if (!session) redirect('/login')

  const [products, productions] = await Promise.all([
    prisma.product.findMany({
      where: { userId: session.userId },
      include: { recipe: { include: { items: { include: { rawMaterial: true } } } } },
      orderBy: { name: 'asc' },
    }),
    prisma.production.findMany({
      where: { userId: session.userId },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">⚙️ Produção</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Registre produções. O sistema baixa os ingredientes e atualiza o estoque automaticamente.
          </p>
        </div>
        <ProductionClient initialProducts={products} initialProductions={productions} />
      </div>
    </AppShell>
  )
}
