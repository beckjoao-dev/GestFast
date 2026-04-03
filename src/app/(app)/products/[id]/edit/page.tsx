import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import ProductForm from '@/components/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = getCurrentUser()
  if (!session) redirect('/login')

  const [product, ingredients, extraCosts] = await Promise.all([
    prisma.product.findFirst({
      where: { id: params.id, userId: session.userId },
      include: { ingredients: true },
    }),
    prisma.ingredient.findMany({ where: { userId: session.userId }, orderBy: { name: 'asc' } }),
    prisma.extraCost.findMany({ where: { userId: session.userId }, orderBy: { category: 'asc' } }),
  ])

  if (!product) notFound()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Editar produto</h1>
        <p className="text-slate-400 text-sm mt-1">{product.name}</p>
      </div>
      <ProductForm
        ingredients={ingredients}
        extraCosts={extraCosts}
        mode="edit"
        defaultValues={{
          id: product.id, name: product.name,
          timeMinutes: product.timeMinutes, marginPct: product.marginPct,
          batchSize: product.batchSize, energyCost: product.energyCost,
          gasCost: product.gasCost, packCost: product.packCost, otherCost: product.otherCost,
          ingredients: product.ingredients.map(i => ({ ingredientId: i.ingredientId, quantity: i.quantity })),
        }}
      />
    </div>
  )
}
