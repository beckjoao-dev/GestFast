import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SimulationClient from '@/components/SimulationClient'

export default async function SimulationPage() {
  const session = getCurrentUser()
  if (!session) redirect('/login')
  const products = await prisma.product.findMany({
    where: { userId: session.userId },
    include: { ingredients: { include: { ingredient: true } } },
    orderBy: { name: 'asc' },
  })
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">💡 Simulador de lucro</h1>
        <p className="text-slate-400 text-sm mt-0.5">Teste preços e veja exatamente quanto você vai ganhar por dia e por mês.</p>
      </div>
      <SimulationClient products={products} />
    </div>
  )
}
