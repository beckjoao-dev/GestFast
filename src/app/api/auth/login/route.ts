import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, makeAuthResponse } from '@/lib/auth'
import { LoginSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    // 1. Parse do body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Corpo da requisição inválido' }, { status: 400 })
    }

    // 2. Validação
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors.map(e => e.message).join(', ') },
        { status: 422 }
      )
    }
    const data = parsed.data

    // 3. Buscar usuário
    let user
    try {
      user = await prisma.user.findUnique({ where: { email: data.email } })
    } catch (dbErr) {
      console.error('[login] Erro de banco de dados:', dbErr)
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com o banco de dados. Verifique as variáveis de ambiente.' },
        { status: 503 }
      )
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'E-mail ou senha inválidos' }, { status: 401 })
    }

    // 4. Verificar senha
    const valid = await comparePassword(data.password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, error: 'E-mail ou senha inválidos' }, { status: 401 })
    }

    // 5. Gerar token e retornar
    const token = signToken({ userId: user.id, email: user.email, role: user.role })
    return makeAuthResponse(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      token
    )

  } catch (e) {
    console.error('[login] Erro inesperado:', e)
    return NextResponse.json(
      { success: false, error: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}
