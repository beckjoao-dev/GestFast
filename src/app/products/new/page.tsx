import AppShell from '@/components/AppShell'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProductForm from '@/components/ProductForm'

export default async function NewProductPage() {
  const session = getCurrentUser()
  if (!session) redirect('/login')

  const [ingredients, extraCosts] = await Promise.all([
    prisma.ingredient.findMany({ where: { userId: session.userId }, orderBy: { name: 'asc' } }),
    prisma.extraCost.findMany({ where: { userId: session.userId }, orderBy: { category: 'asc' } }),
  ])

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">📦 Novo produto</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Crie o produto. Depois adicione a ficha técnica para calcular o custo automaticamente.
          </p>
        </div>
        <ProductForm ingredients={ingredients} extraCosts={extraCosts} mode="create" />
      </div>
    </AppShell>
  )
}
