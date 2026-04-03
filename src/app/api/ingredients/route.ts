import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { IngredientSchema } from '@/lib/validations'
import { ok, validationErr, handleAuthError } from '@/lib/api'

export async function GET() {
  try {
    const session     = requireAuth()
    const ingredients = await prisma.ingredient.findMany({
      where:   { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    })
    return ok({ ingredients })
  } catch (e) {
    return handleAuthError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireAuth()
    const body    = IngredientSchema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)
    const ingredient = await prisma.ingredient.create({
      data: { ...body.data, userId: session.userId },
    })
    return ok({ ingredient }, 201)
  } catch (e) {
    return handleAuthError(e)
  }
}
