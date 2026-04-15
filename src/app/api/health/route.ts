import { NextResponse } from 'next/server'

// GET /api/health — diagnóstico público (não expõe dados sensíveis)
// Acesse no Vercel: seusite.vercel.app/api/health
export async function GET() {
  const checks = {
    timestamp:    new Date().toISOString(),
    node_env:     process.env.NODE_ENV ?? 'AUSENTE',
    database_url: process.env.DATABASE_URL
      ? `OK (${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] ?? 'host oculto'})`
      : 'AUSENTE — adicione no Vercel: Project Settings → Environment Variables',
    direct_url:   process.env.DIRECT_URL
      ? 'OK (definida)'
      : 'AUSENTE — necessária para migrations',
    jwt_secret:   process.env.JWT_SECRET
      ? `OK (${process.env.JWT_SECRET.length} caracteres)`
      : 'AUSENTE — adicione no Vercel: Project Settings → Environment Variables',
    prisma: 'não testado',
  }

  // Testa conexão com o banco
  try {
    const { PrismaClient } = await import('@prisma/client')
    const p = new PrismaClient()
    await p.$connect()
    await p.$disconnect()
    checks.prisma = 'CONECTADO com sucesso'
  } catch (e: unknown) {
    checks.prisma = `ERRO: ${e instanceof Error ? e.message : String(e)}`
  }

  const allOk = (
    checks.database_url.startsWith('OK') &&
    checks.jwt_secret.startsWith('OK') &&
    checks.prisma.startsWith('CONECTADO')
  )

  return NextResponse.json(
    { status: allOk ? 'ok' : 'erro', checks },
    { status: allOk ? 200 : 500 }
  )
}
