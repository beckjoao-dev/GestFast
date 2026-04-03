import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, validationErr, handleAuthError } from '@/lib/api'
import { z, ZodError } from 'zod'

const ExtraCostSchema = z.object({
  name:      z.string().min(1, 'Informe o nome').max(100),
  category:  z.enum(['energy', 'gas', 'packaging', 'labor', 'other']),
  totalCost: z.number().positive('Informe um custo válido'),
  totalQty:  z.number().positive('Informe uma quantidade válida'),
  unit:      z.string().min(1).max(30),
})

export async function GET() {
  try {
    const session = requireAuth()
    const extraCosts = await prisma.extraCost.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    })
    return ok({ extraCosts })
  } catch (e) { return handleAuthError(e) }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireAuth()
    const data    = ExtraCostSchema.parse(await req.json())
    const extraCost = await prisma.extraCost.create({
      data: { ...data, userId: session.userId },
    })
    return ok({ extraCost }, 201)
  } catch (e) {
    if (e instanceof ZodError) return validationErr(e)
    return handleAuthError(e)
  }
}
