import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleAuthError, validationErr } from '@/lib/api'
import { checkProductionStock, deductForProduction } from '@/services/stock-service'
import { z } from 'zod'

const Schema = z.object({
  productId: z.string().min(1),
  qty:       z.number().positive(),
  notes:     z.string().optional(),
  execute:   z.boolean().default(false), // false = só verificar, true = executar
})

export async function GET() {
  try {
    const s = requireAuth()
    const productions = await prisma.production.findMany({
      where: { userId: s.userId },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    return ok({ productions })
  } catch (e) { return handleAuthError(e) }
}

export async function POST(req: NextRequest) {
  try {
    const s    = requireAuth()
    const body = Schema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)
    const { productId, qty, notes, execute } = body.data

    const check = await checkProductionStock({ userId: s.userId, productId, qty })
    if (!check.canProduce && execute) {
      return ok({ ok: false, shortages: check.shortages, message: 'Estoque insuficiente' }, 422)
    }

    if (execute && check.canProduce) {
      const result = await deductForProduction({ userId: s.userId, productId, qty })
      if (!result.ok) return ok({ ok: false, shortages: result.shortages }, 422)
      const production = await prisma.production.create({
        data: { productId, userId: s.userId, qty, status: 'COMPLETED', producedAt: new Date(), totalCost: check.totalCost, unitCost: check.unitCost, notes },
      })
      return ok({ ok: true, production }, 201)
    }

    // Só verificar
    return ok({ ok: check.canProduce, check })
  } catch (e) { return handleAuthError(e) }
}
