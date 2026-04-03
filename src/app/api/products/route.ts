import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ProductSchema } from '@/lib/validations'
import { ok, validationErr, handleAuthError } from '@/lib/api'
import { ZodError } from 'zod'

const productInclude = {
  ingredients: { include: { ingredient: true } },
}

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

export async function POST(req: NextRequest) {
  try {
    const session = requireAuth()
    const { ingredients, ...data } = ProductSchema.parse(await req.json())
    const product = await prisma.product.create({
      data: {
        ...data,
        userId: session.userId,
        ingredients: {
          create: ingredients.map(i => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
          })),
        },
      },
      include: productInclude,
    })
    return ok({ product }, 201)
  } catch (e) {
    if (e instanceof ZodError) return validationErr(e)
    return handleAuthError(e)
  }
}
