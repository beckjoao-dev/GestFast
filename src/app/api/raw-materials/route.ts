import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, validationErr, handleAuthError } from '@/lib/api'
import { calcUnitCost } from '@/services/cost-calculator'
import { z } from 'zod'

const Schema = z.object({
  name:        z.string().min(1).max(100),
  category:    z.string().optional(),
  unit:        z.enum(['g','kg','ml','l','un','cx','pct']),
  totalCost:   z.number().positive(),
  totalQty:    z.number().positive(),
  minStockQty: z.number().min(0).default(0),
  supplier:    z.string().optional(),
  expiresAt:   z.string().optional(),
  batchNumber: z.string().optional(),
  notes:       z.string().optional(),
})

export async function GET() {
  try {
    const s = requireAuth()
    const items = await prisma.rawMaterial.findMany({
      where: { userId: s.userId },
      orderBy: { name: 'asc' },
    })
    return ok({ items })
  } catch (e) { return handleAuthError(e) }
}

export async function POST(req: NextRequest) {
  try {
    const s    = requireAuth()
    const body = Schema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)
    const d = body.data
    const unitCost = calcUnitCost(d.totalCost, d.totalQty, d.unit)
    const item = await prisma.rawMaterial.create({
      data: {
        ...d,
        unitCost,
        stockQty:  0,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined,
        userId:    s.userId,
      },
    })
    return ok({ item }, 201)
  } catch (e) { return handleAuthError(e) }
}
