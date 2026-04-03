import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { RegisterSchema } from '@/lib/validations'
import { ok, err, validationErr, handleAuthError } from '@/lib/api'
import { ZodError, z } from 'zod'

const CreateUserSchema = RegisterSchema.extend({
  role: z.enum(['ADMIN', 'USER']).default('USER'),
})

export async function GET() {
  try {
    requireAdmin()
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
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
    const data = CreateUserSchema.parse(await req.json())
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return err('E-mail já cadastrado', 409)
    const passwordHash = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: data.role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    return ok({ user }, 201)
  } catch (e) {
    if (e instanceof ZodError) return validationErr(e)
    return handleAuthError(e)
  }
}
