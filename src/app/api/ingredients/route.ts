import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { IngredientSchema } from '@/lib/validations'
import { ok, validationErr, handleAuthError, serverError } from '@/lib/api'
import { ZodError } from 'zod'

export async function GET() {
  try {
    const session = requireAuth()
    const ingredients = await prisma.ingredient.findMany({
      where: { userId: session.userId },
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
    const data = IngredientSchema.parse(await req.json())
    const ingredient = await prisma.ingredient.create({
      data: { ...data, userId: session.userId },
    })
    return ok({ ingredient }, 201)
  } catch (e) {
    if (e instanceof ZodError) return validationErr(e)
    return handleAuthError(e)
  }
}
