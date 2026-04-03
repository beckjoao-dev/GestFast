import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, makeAuthResponse } from '@/lib/auth'
import { LoginSchema } from '@/lib/validations'
import { err, validationErr, serverError } from '@/lib/api'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = LoginSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) return err('E-mail ou senha inválidos', 401)

    const valid = await comparePassword(data.password, user.passwordHash)
    if (!valid) return err('E-mail ou senha inválidos', 401)

    const token = signToken({ userId: user.id, email: user.email, role: user.role })

    // Seta cookie diretamente na response — método mais confiável no Next.js 14
    return makeAuthResponse(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      token
    )
  } catch (e) {
    if (e instanceof ZodError) return validationErr(e)
    console.error('[login]', e)
    return serverError()
  }
}
