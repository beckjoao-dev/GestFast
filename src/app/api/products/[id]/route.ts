import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ProductSchema } from '@/lib/validations'
import { ok, validationErr, notFound, handleAuthError } from '@/lib/api'

const productInclude = {
  ingredients: { include: { ingredient: true } },
} as const

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth()
    const product = await prisma.product.findFirst({
      where:   { id: params.id, userId: session.userId },
      include: productInclude,
    })
    if (!product) return notFound('Produto')
    return ok({ product })
  } catch (e) {
    return handleAuthError(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session  = requireAuth()
    const existing = await prisma.product.findFirst({
      where: { id: params.id, userId: session.userId },
    })
    if (!existing) return notFound('Produto')

    const body = ProductSchema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)
    const { ingredients, ...data } = body.data

    const product = await prisma.$transaction(async tx => {
      await tx.productIngredient.deleteMany({ where: { productId: params.id } })
      return tx.product.update({
        where: { id: params.id },
        data: {
          ...data,
          ingredients: {
            create: ingredients.map(i => ({
              ingredientId: i.ingredientId,
              quantity:     i.quantity,
            })),
          },
        },
        include: productInclude,
      })
    })
    return ok({ product })
  } catch (e) {
    return handleAuthError(e)
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session  = requireAuth()
    const existing = await prisma.product.findFirst({
      where: { id: params.id, userId: session.userId },
    })
    if (!existing) return notFound('Produto')
    await prisma.product.delete({ where: { id: params.id } })
    return ok({ message: 'Produto removido' })
  } catch (e) {
    return handleAuthError(e)
  }
}
