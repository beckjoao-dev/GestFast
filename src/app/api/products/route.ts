import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ProductSchema } from '@/lib/validations'
import { ok, validationErr, handleAuthError } from '@/lib/api'

const productInclude = {
  ingredients: { include: { ingredient: true } },
  extraCosts: true, // opcional (retornar custos extras)
} as const

// 🔍 GET
export async function GET() {
  try {
    const session = requireAuth()

    const products = await prisma.product.findMany({
      where: { userId: session.userId },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    })

    return ok({ products })
  } catch (e) {
    return handleAuthError(e)
  }
}

// ➕ CREATE
export async function POST(req: NextRequest) {
  try {
    const session = requireAuth()

    const body = ProductSchema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)

    // ✅ CORREÇÃO AQUI
    const { ingredients, extraCosts, ...data } = body.data

    const product = await prisma.product.create({
      data: {
        ...data,
        userId: session.userId,

        // ingredientes
        ingredients: {
          create: ingredients.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
          })),
        },

        // custos extras (corrigido)
        ...(extraCosts && extraCosts.length > 0 && {
          extraCosts: {
            create: extraCosts.map((e) => ({
              extraCostId: e.extraCostId,
              quantity: e.quantity,
            })),
          },
        }),
      },
      include: productInclude,
    })

    return ok({ product }, 201)
  } catch (e) {
    return handleAuthError(e)
  }
}