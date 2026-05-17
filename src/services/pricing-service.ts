import { prisma } from '@/lib/prisma'
import { calcRecipeCost, calcPricing, calcUnitCost } from '@/services/cost-calculator'

export async function recalcProduct(productId: string, userId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
    include: { recipe: { include: { items: { include: { rawMaterial: true } } } } },
  })
  if (!product) return null

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const laborCostPerHour = Number(user?.laborCostPerHour ?? 0)

  let unitCost         = 0
  let ingredientCost   = 0
  let laborCost        = 0
  let totalBatchCost   = 0

  if (product.recipe) {
    const r  = product.recipe
    const bd = calcRecipeCost({
      items: r.items.map(i => ({
        quantity: Number(i.quantity),
        unitCost: Number(i.rawMaterial.unitCost),
        unit:     i.rawMaterial.unit,
      })),
      yieldQty:         Number(r.yieldQty),
      laborMinutes:     r.laborMinutes,
      laborCostPerHour,
      packagingCost:    Number(r.packagingCost),
      extraCost:        Number(r.extraCost),
    })
    unitCost       = bd.unitCost
    ingredientCost = bd.ingredientCost
    laborCost      = bd.laborCost
    totalBatchCost = bd.totalBatchCost
  }

  const pricing = calcPricing(unitCost, {
    unitCost,
    marginPct: Number(product.marginPct),
    salePrice: Number(product.salePrice),
  })

  const oldUnitCost = Number(product.unitCost)

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        ingredientCost,
        laborCost,
        totalCost:      totalBatchCost,
        unitCost,
        suggestedPrice: pricing.suggestedPrice,
        profitPerUnit:  pricing.profitPerUnit,
      },
    }),
    ...(Math.abs(oldUnitCost - unitCost) > 0.001
      ? [prisma.priceHistory.create({
          data: {
            productId,
            unitCost,
            salePrice: Number(product.salePrice),
            marginPct: pricing.marginPct,
          },
        })]
      : []),
  ])

  return pricing
}

export async function recalcProductsByRawMaterial(rawMaterialId: string, userId: string) {
  const recipeItems = await prisma.recipeItem.findMany({
    where: { rawMaterialId },
    select: { recipe: { select: { productId: true } } },
  })
  const productIds = [...new Set(recipeItems.map(ri => ri.recipe.productId))]
  return Promise.all(productIds.map(pid => recalcProduct(pid, userId)))
}

export async function updateRawMaterialCost(params: {
  rawMaterialId: string
  userId:        string
  totalCost:     number
  totalQty:      number
  unit:          string
}) {
  const { rawMaterialId, userId, totalCost, totalQty, unit } = params
  const unitCost = calcUnitCost(totalCost, totalQty, unit)

  await prisma.rawMaterial.update({
    where: { id: rawMaterialId },
    data:  { totalCost, totalQty, unitCost },
  })

  await prisma.recipeItem.updateMany({
    where: { rawMaterialId },
    data:  { unitCost },
  })

  await recalcProductsByRawMaterial(rawMaterialId, userId)
}
