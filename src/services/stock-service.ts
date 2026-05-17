/**
 * stock-service.ts
 * Lógica de estoque, movimentações e alertas.
 */
import { prisma } from '@/lib/prisma'

type MovementType = 'IN' | 'OUT' | 'PRODUCTION_IN' | 'PRODUCTION_OUT' | 'LOSS' | 'ADJUSTMENT'

// ─── Movimentação de matéria-prima ────────────────────────────────────────────

export async function movRawMaterial(params: {
  userId:        string
  rawMaterialId: string
  type:          MovementType
  qty:           number
  unitCost?:     number
  reason?:       string
}) {
  const { userId, rawMaterialId, type, qty, unitCost = 0, reason } = params

  const mat = await prisma.rawMaterial.findFirst({ where: { id: rawMaterialId, userId } })
  if (!mat) throw new Error('Matéria-prima não encontrada')

  const currentQty = Number(mat.stockQty)
  const newQty     = currentQty + qty
  if (newQty < 0) throw new Error(`Estoque insuficiente: ${mat.name}. Disponível: ${currentQty} ${mat.unit}`)

  const effectiveUnitCost = unitCost || Number(mat.unitCost)
  const totalCost         = Math.abs(qty) * effectiveUnitCost

  await prisma.$transaction([
    prisma.rawMaterial.update({ where: { id: rawMaterialId }, data: { stockQty: newQty } }),
    prisma.stockMovement.create({
      data: { type, qty, unitCost: effectiveUnitCost, totalCost, reason, userId, rawMaterialId },
    }),
  ])

  // Alerta estoque baixo
  if (newQty <= Number(mat.minStockQty) && Number(mat.minStockQty) > 0) {
    await prisma.alert.create({
      data: { userId, type: 'LOW_STOCK', message: `Estoque baixo: ${mat.name} (${newQty} ${mat.unit} restantes)` },
    }).catch(() => {})
  }

  return newQty
}

// ─── Movimentação de produto final ────────────────────────────────────────────

export async function movProduct(params: {
  userId:    string
  productId: string
  type:      MovementType
  qty:       number
  reason?:   string
}) {
  const { userId, productId, type, qty, reason } = params

  const product = await prisma.product.findFirst({ where: { id: productId, userId } })
  if (!product) throw new Error('Produto não encontrado')

  const currentQty = Number(product.stockQty)
  const newQty     = currentQty + qty
  if (newQty < 0) throw new Error(`Estoque insuficiente: ${product.name}`)

  await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: { stockQty: newQty } }),
    prisma.stockMovement.create({
      data: { type, qty, unitCost: Number(product.unitCost), totalCost: Math.abs(qty) * Number(product.unitCost), reason, userId, productId },
    }),
  ])

  return newQty
}

// ─── Baixa automática por produção ───────────────────────────────────────────

export async function deductForProduction(params: {
  userId:    string
  productId: string
  qty:       number
}) {
  const { userId, productId, qty } = params

  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
    include: { recipe: { include: { items: { include: { rawMaterial: true } } } } },
  })
  if (!product?.recipe) throw new Error('Produto sem ficha técnica')

  const yieldQty = Number(product.recipe.yieldQty)
  const batches  = qty / yieldQty

  // Verificar antes de baixar
  const shortages: Array<{ name: string; needed: number; available: number; unit: string }> = []
  for (const item of product.recipe.items) {
    const needed    = Number(item.quantity) * batches
    const available = Number(item.rawMaterial.stockQty)
    if (needed > available) shortages.push({ name: item.rawMaterial.name, needed, available, unit: item.rawMaterial.unit })
  }
  if (shortages.length > 0) return { ok: false, shortages }

  // Baixar ingredientes
  for (const item of product.recipe.items) {
    const needed = Number(item.quantity) * batches
    await movRawMaterial({
      userId, rawMaterialId: item.rawMaterialId,
      type: 'PRODUCTION_OUT', qty: -needed,
      reason: `Produção: ${product.name} (${qty} un.)`,
    })
  }

  // Adicionar produto ao estoque
  await movProduct({ userId, productId, type: 'PRODUCTION_IN', qty, reason: `Produção concluída: ${qty} un.` })

  return { ok: true, shortages: [] }
}

// ─── Verificar estoque (sem baixar) ──────────────────────────────────────────

export async function checkProductionStock(params: {
  userId:    string
  productId: string
  qty:       number
}) {
  const { userId, productId, qty } = params

  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
    include: { recipe: { include: { items: { include: { rawMaterial: true } } } } },
  })
  if (!product?.recipe) return { canProduce: false, shortages: [], totalCost: 0, unitCost: 0 }

  const yieldQty = Number(product.recipe.yieldQty)
  const batches  = qty / yieldQty
  const shortages: Array<{ name: string; needed: number; available: number; unit: string }> = []
  let totalIngredientCost = 0

  for (const item of product.recipe.items) {
    const needed    = Number(item.quantity) * batches
    const available = Number(item.rawMaterial.stockQty)
    totalIngredientCost += needed * Number(item.rawMaterial.unitCost)
    if (needed > available) shortages.push({ name: item.rawMaterial.name, needed, available, unit: item.rawMaterial.unit })
  }

  const totalCost = totalIngredientCost + Number(product.recipe.packagingCost) + Number(product.recipe.extraCost)
  const unitCost  = qty > 0 ? totalCost / qty : 0

  return { canProduce: shortages.length === 0, shortages, totalCost, unitCost }
}
