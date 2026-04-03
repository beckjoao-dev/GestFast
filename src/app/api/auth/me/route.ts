import { getCurrentUser } from '@/lib/auth'
import { makeClearCookieResponse } from '@/lib/auth'
import { ok, unauthorized } from '@/lib/api'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = getCurrentUser()
  if (!session) return unauthorized()
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!user) return unauthorized()
  return ok({ user })
}

export async function POST() {
  return makeClearCookieResponse({ message: 'Sessão encerrada' })
}
