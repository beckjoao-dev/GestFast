import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ProductSchema } from '@/lib/validations'
import { ok, validationErr, handleAuthError } from '@/lib/api'

const productInclude = {
  ingredients: { include: { ingredient: true } },
} as const

export async function GET() {
  try {
    const session  = requireAuth()
    const products = await prisma.product.findMany({
      where:   { userId: session.userId },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    })
    return ok({ products })
  } catch (e) {
    return handleAuthError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireAuth()
    const body    = ProductSchema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)
    const { ingredients, ...data } = body.data
    const product = await prisma.product.create({
      data: {
        ...data,
        userId: session.userId,
        ingredients: {
          create: ingredients.map(i => ({
            ingredientId: i.ingredientId,
            quantity:     i.quantity,
          })),
        },
      },
      include: productInclude,
    })
    return ok({ product }, 201)
  } catch (e) {
    return handleAuthError(e)
  }
}
