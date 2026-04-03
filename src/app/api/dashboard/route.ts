import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleAuthError } from '@/lib/api'
import { calcProductCost } from '@/lib/pricing'

export async function GET() {
  try {
    const session = requireAuth()

    const [products, ingredientCount] = await Promise.all([
      prisma.product.findMany({
        where:   { userId: session.userId },
        include: { ingredients: { include: { ingredient: true } } },
      }),
      prisma.ingredient.count({ where: { userId: session.userId } }),
    ])

    const calcs = products.map(p => ({
      product: p,
      result:  calcProductCost({
        ingredients: p.ingredients.map(pi => ({
          totalCost: pi.ingredient.totalCost,
          totalQty:  pi.ingredient.totalQty,
          quantity:  pi.quantity,
        })),
        energyCost: p.energyCost,
        gasCost:    p.gasCost,
        packCost:   p.packCost,
        otherCost:  p.otherCost,
        batchSize:  p.batchSize,
        marginPct:  p.marginPct,
      }),
    }))

    const alerts: { type: 'warn' | 'danger'; message: string }[] = []
    for (const { product } of calcs) {
      if (product.marginPct < 20)
        alerts.push({ type: 'danger', message: `"${product.name}": margem crítica (${product.marginPct}%).` })
      else if (product.marginPct < 35)
        alerts.push({ type: 'warn', message: `"${product.name}": margem baixa (${product.marginPct}%).` })
    }

    return ok({ productCount: products.length, ingredientCount, alerts })
  } catch (e) {
    return handleAuthError(e)
  }
}
