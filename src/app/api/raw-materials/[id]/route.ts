import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, notFound, handleAuthError, validationErr } from '@/lib/api'
import { updateRawMaterialCost } from '@/services/pricing-service'
import { z } from 'zod'

const PatchSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  category:    z.string().optional(),
  totalCost:   z.number().positive().optional(),
  totalQty:    z.number().positive().optional(),
  minStockQty: z.number().min(0).optional(),
  supplier:    z.string().optional(),
  notes:       z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s    = requireAuth()
    const body = PatchSchema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)
    const existing = await prisma.rawMaterial.findFirst({ where: { id: params.id, userId: s.userId } })
    if (!existing) return notFound('Matéria-prima')
    const d = body.data
    if (d.totalCost !== undefined || d.totalQty !== undefined) {
      await updateRawMaterialCost({
        rawMaterialId: params.id,
        userId:        s.userId,
        totalCost:     d.totalCost ?? Number(existing.totalCost),
        totalQty:      d.totalQty  ?? Number(existing.totalQty),
        unit:          existing.unit,
      })
    }
    const item = await prisma.rawMaterial.update({
      where: { id: params.id },
      data:  { name: d.name, category: d.category, minStockQty: d.minStockQty, supplier: d.supplier, notes: d.notes },
    })
    return ok({ item })
  } catch (e) { return handleAuthError(e) }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = requireAuth()
    const existing = await prisma.rawMaterial.findFirst({ where: { id: params.id, userId: s.userId } })
    if (!existing) return notFound('Matéria-prima')
    await prisma.rawMaterial.delete({ where: { id: params.id } })
    return ok({ message: 'Removido' })
  } catch (e) { return handleAuthError(e) }
}
