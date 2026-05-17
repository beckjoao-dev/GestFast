import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleAuthError, validationErr } from '@/lib/api'
import { recalcProduct } from '@/services/pricing-service'
import { z } from 'zod'

const RecipeItemSchema = z.object({
  rawMaterialId: z.string().min(1),
  quantity:      z.number().positive(),
})

const Schema = z.object({
  productId:    z.string().min(1),
  yieldQty:     z.number().positive(),
  yieldUnit:    z.enum(['g','kg','ml','l','un','cx','pct']),
  laborMinutes: z.number().min(0).default(0),
  packagingCost: z.number().min(0).default(0),
  extraCost:    z.number().min(0).default(0),
  notes:        z.string().optional(),
  items:        z.array(RecipeItemSchema).min(0).default([]),
})

export async function POST(req: NextRequest) {
  try {
    const s    = requireAuth()
    const body = Schema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)
    const { productId, items, ...recipeData } = body.data

    // Verificar que o produto pertence ao usuário
    const product = await prisma.product.findFirst({ where: { id: productId, userId: s.userId } })
    if (!product) return ok({ error: 'Produto não encontrado' }, 404)

    // Upsert da receita
    const recipe = await prisma.recipe.upsert({
      where:  { productId },
      update: { ...recipeData, items: { deleteMany: {}, create: items.map(i => ({ rawMaterialId: i.rawMaterialId, quantity: i.quantity, unitCost: 0 })) } },
      create: { productId, ...recipeData, items: { create: items.map(i => ({ rawMaterialId: i.rawMaterialId, quantity: i.quantity, unitCost: 0 })) } },
      include: { items: { include: { rawMaterial: true } } },
    })

    // Recalcular custo do produto
    await recalcProduct(productId, s.userId)

    return ok({ recipe }, 201)
  } catch (e) { return handleAuthError(e) }
}
