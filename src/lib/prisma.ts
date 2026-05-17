import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

function createPrismaClient() {
  // Valida que DATABASE_URL existe antes de criar o cliente
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL não está definida. ' +
      'Verifique as variáveis de ambiente no Vercel: ' +
      'Project Settings → Environment Variables'
    )
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })
}

export const prisma = global.prismaGlobal ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma
}
