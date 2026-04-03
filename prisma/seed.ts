import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Cria o admin master
  const adminHash = await bcrypt.hash('admin123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gestfast.com' },
    update: {},
    create: {
      email: 'admin@gestfast.com',
      name: 'Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  // Cria um usuário demo comum
  const userHash = await bcrypt.hash('demo123456', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@gestfast.com' },
    update: {},
    create: {
      email: 'demo@gestfast.com',
      name: 'Ana Silva',
      passwordHash: userHash,
      role: 'USER',
    },
  })

  // Ingredientes do usuário demo
  const farinha  = await prisma.ingredient.create({ data: { userId: user.id, name: 'Farinha de trigo', unit: 'g',  totalCost: 5.50,  totalQty: 1000 } })
  const acucar   = await prisma.ingredient.create({ data: { userId: user.id, name: 'Açúcar refinado',  unit: 'g',  totalCost: 3.20,  totalQty: 1000 } })
  const leite    = await prisma.ingredient.create({ data: { userId: user.id, name: 'Leite integral',   unit: 'ml', totalCost: 4.80,  totalQty: 1000 } })
  const ovo      = await prisma.ingredient.create({ data: { userId: user.id, name: 'Ovo',              unit: 'un', totalCost: 0.90,  totalQty: 1    } })
  const manteiga = await prisma.ingredient.create({ data: { userId: user.id, name: 'Manteiga',         unit: 'g',  totalCost: 12.00, totalQty: 200  } })

  await prisma.product.create({
    data: {
      userId: user.id, name: 'Bolo de Pote', timeMinutes: 90,
      marginPct: 40, batchSize: 10, energyCost: 2.50, gasCost: 1.80, packCost: 0.80,
      ingredients: { create: [
        { ingredientId: farinha.id,  quantity: 200 },
        { ingredientId: acucar.id,   quantity: 150 },
        { ingredientId: leite.id,    quantity: 100 },
        { ingredientId: ovo.id,      quantity: 2   },
      ]},
    },
  })

  await prisma.product.create({
    data: {
      userId: user.id, name: 'Cookie Artesanal', timeMinutes: 45,
      marginPct: 18, batchSize: 24, energyCost: 1.20, gasCost: 0.80, packCost: 0.30,
      ingredients: { create: [
        { ingredientId: farinha.id,   quantity: 250 },
        { ingredientId: acucar.id,    quantity: 120 },
        { ingredientId: manteiga.id,  quantity: 80  },
      ]},
    },
  })

  await prisma.product.create({
    data: {
      userId: user.id, name: 'Brigadeiro Gourmet', timeMinutes: 60,
      marginPct: 55, batchSize: 30, energyCost: 0.80, gasCost: 1.20, packCost: 0.20, otherCost: 0.50,
      ingredients: { create: [
        { ingredientId: leite.id,  quantity: 200 },
        { ingredientId: acucar.id, quantity: 100 },
      ]},
    },
  })

  console.log('✅ Seed concluído!')
  console.log('   Admin:  admin@gestfast.com / admin123456')
  console.log('   Usuário: demo@gestfast.com  / demo123456')
}

main().catch(console.error).finally(() => prisma.$disconnect())
