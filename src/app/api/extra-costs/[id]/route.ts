import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, notFound, handleAuthError } from '@/lib/api'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireAuth()
    const existing = await prisma.extraCost.findFirst({ where: { id: params.id, userId: session.userId } })
    if (!existing) return notFound('Custo')
    await prisma.extraCost.delete({ where: { id: params.id } })
    return ok({ message: 'Custo removido' })
  } catch (e) { return handleAuthError(e) }
}
