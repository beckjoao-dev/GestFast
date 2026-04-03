import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { ok, err, notFound, handleAuthError } from '@/lib/api'
import { z, ZodError } from 'zod'

const UpdateUserSchema = z.object({
  name:     z.string().min(2).max(80).optional(),
  password: z.string().min(8).max(100).optional(),
  role:     z.enum(['ADMIN', 'USER']).optional(),
})

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = requireAdmin()
    if (admin.userId === params.id) return err('Você não pode excluir sua própria conta', 400)
    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('Usuário')
    await prisma.user.delete({ where: { id: params.id } })
    return ok({ message: 'Usuário removido' })
  } catch (e) {
    return handleAuthError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin()
    const body = UpdateUserSchema.parse(await req.json())
    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing) return notFound('Usuário')

    const updateData: Record<string, unknown> = {}
    if (body.name) updateData.name = body.name
    if (body.role) updateData.role = body.role
    if (body.password) updateData.passwordHash = await hashPassword(body.password)

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    })
    return ok({ user })
  } catch (e) {
    if (e instanceof ZodError) return handleAuthError(e)
    return handleAuthError(e)
  }
}
