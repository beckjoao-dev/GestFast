import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import IngredientManager from '@/components/IngredientManager'

export default async function IngredientsPage() {
  const session = getCurrentUser()
  if (!session) redirect('/login')
  const ingredients = await prisma.ingredient.findMany({
    where: { userId: session.userId }, orderBy: { createdAt: 'desc' },
  })
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">🛒 Ingredientes</h1>
        <p className="text-slate-400 text-sm mt-0.5">Cadastre o que você compra. O sistema calcula o custo por grama automaticamente.</p>
      </div>
      <IngredientManager initialIngredients={ingredients} />
    </div>
  )
}
