import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken, makeAuthResponse } from '@/lib/auth'
import { RegisterSchema } from '@/lib/validations'
import { err, validationErr, serverError } from '@/lib/api'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = RegisterSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existing) return err('E-mail já cadastrado', 409)

    const passwordHash = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true, // ✅ IMPORTANTE
        createdAt: true,
      },
    })

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return makeAuthResponse({ user }, token, 201)

  } catch (e) {
    if (e instanceof ZodError) return validationErr(e)
    console.error('[register]', e)
    return serverError()
  }
}