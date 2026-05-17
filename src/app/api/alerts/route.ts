import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleAuthError } from '@/lib/api'

export async function GET() {
  try {
    const s = requireAuth()
    const alerts = await prisma.alert.findMany({
      where: { userId: s.userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return ok({ alerts })
  } catch (e) { return handleAuthError(e) }
}

export async function PATCH(req: NextRequest) {
  try {
    const s    = requireAuth()
    const body = await req.json()
    await prisma.alert.updateMany({
      where: { userId: s.userId, id: { in: body.ids } },
      data:  { read: true },
    })
    return ok({ message: 'Alertas marcados como lidos' })
  } catch (e) { return handleAuthError(e) }
}
