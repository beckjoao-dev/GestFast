import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ExtraCostManager from '@/components/ExtraCostManager'

export default async function CostsPage() {
  const session = getCurrentUser()
  if (!session) redirect('/login')
  const extraCosts = await prisma.extraCost.findMany({
    where: { userId: session.userId }, orderBy: { category: 'asc' },
  })
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">⚡ Custos fixos</h1>
        <p className="text-slate-400 text-sm mt-0.5">Cadastre gás, energia e embalagem uma vez. O sistema distribui automaticamente em cada produto.</p>
      </div>
      <div className="alert-blue mb-6">
        <span className="text-lg shrink-0">💡</span>
        <div>
          <p className="font-semibold">Como funciona?</p>
          <p className="font-normal text-sm mt-0.5">Você informa o custo total (ex: botijão R$ 120) e quantas vezes ele rende (ex: 30 receitas). O sistema calcula <strong>R$ 4,00 por receita</strong> e soma ao custo de cada produto automaticamente.</p>
        </div>
      </div>
      <ExtraCostManager initialCosts={extraCosts} />
    </div>
  )
}
