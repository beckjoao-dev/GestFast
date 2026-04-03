import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { ok, err, validationErr, handleAuthError } from '@/lib/api'
import { z } from 'zod'

const CreateUserSchema = z.object({
  name:     z.string().min(2, 'Nome muito curto').max(80),
  email:    z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres').max(100),
  role:     z.enum(['ADMIN', 'USER']).default('USER'),
})

export async function GET() {
  try {
    requireAdmin()
    const users = await prisma.user.findMany({
      select:  { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return ok({ users })
  } catch (e) {
    return handleAuthError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin()
    const body = CreateUserSchema.safeParse(await req.json())
    if (!body.success) return validationErr(body.error)

    const existing = await prisma.user.findUnique({ where: { email: body.data.email } })
    if (existing) return err('E-mail já cadastrado', 409)

    const passwordHash = await hashPassword(body.data.password)
    const user = await prisma.user.create({
      data:   { name: body.data.name, email: body.data.email, passwordHash, role: body.data.role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    return ok({ user }, 201)
  } catch (e) {
    return handleAuthError(e)
  }
}
