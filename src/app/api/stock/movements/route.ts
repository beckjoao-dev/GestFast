import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleAuthError, validationErr } from '@/lib/api'
import { movRawMaterial } from '@/services/stock-service'
import { z } from 'zod'

const Schema = z.object({
  rawMaterialId: z.string().optional(),
  productId:     z.string().optional(),
  type:          z.enum(['IN','OUT','LOSS','ADJUSTMENT']),
  qty:           z.number(),
  unitCost:      z.number().optional(),
  reason:        z.string().optional(),
})

export async function GET() {
  try {
    const s = requireAuth()
    const movements = await prisma.stockMovement.findMany({
      where: { userId: s.userId },
      include: {
        rawMaterial: { select: { id: true, name: true, unit: true } },
        product:     { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return ok({ movements })
  } catch (e) { return handleAuthError(e) }
}

export async function POST(req: NextRequest) {
  try {
    const s    = requireAuth()
    const body = Schema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)
    const d = body.data
    if (d.rawMaterialId) {
      const qty = d.type === 'IN' ? Math.abs(d.qty) : -Math.abs(d.qty)
      await movRawMaterial({ userId: s.userId, rawMaterialId: d.rawMaterialId, type: d.type as 'IN'|'OUT'|'LOSS'|'ADJUSTMENT', qty, unitCost: d.unitCost, reason: d.reason })
    }
    return ok({ message: 'Movimentação registrada' }, 201)
  } catch (e) {
    if (e instanceof Error) return ok({ error: e.message }, 400)
    return handleAuthError(e)
  }
}
