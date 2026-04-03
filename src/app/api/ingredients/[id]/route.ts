import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { IngredientSchema } from '@/lib/validations'
import { ok, validationErr, notFound, handleAuthError } from '@/lib/api'
import { ZodError } from 'zod'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth()
    const existing = await prisma.ingredient.findFirst({ where: { id: params.id, userId: session.userId } })
    if (!existing) return notFound('Ingrediente')
    const data = IngredientSchema.parse(await req.json())
    const ingredient = await prisma.ingredient.update({ where: { id: params.id }, data })
    return ok({ ingredient })
  } catch (e) {
    if (e instanceof ZodError) return validationErr(e)
    return handleAuthError(e)
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth()
    const existing = await prisma.ingredient.findFirst({ where: { id: params.id, userId: session.userId } })
    if (!existing) return notFound('Ingrediente')
    await prisma.ingredient.delete({ where: { id: params.id } })
    return ok({ message: 'Ingrediente removido' })
  } catch (e) {
    return handleAuthError(e)
  }
}
