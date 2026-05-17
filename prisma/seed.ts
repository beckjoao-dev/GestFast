import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { calcUnitCost } from '../src/services/cost-calculator'

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash('admin123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gestfast.com' },
    update: {},
    create: {
      email: 'admin@gestfast.com', name: 'Admin',
      passwordHash: adminHash, role: 'ADMIN',
      laborCostPerHour: 15, defaultMarginPct: 35,
    },
  })

  const userHash = await bcrypt.hash('demo123456', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@gestfast.com' },
    update: {},
    create: {
      email: 'demo@gestfast.com', name: 'Ana Silva',
      passwordHash: userHash, role: 'USER',
      laborCostPerHour: 12, defaultMarginPct: 40,
    },
  })

  // Matérias-primas com estoque
  const mats = await Promise.all([
    prisma.rawMaterial.create({ data: { userId: user.id, name: 'Farinha de trigo', category: 'Farináceos', unit: 'kg', totalCost: 5.50, totalQty: 1, unitCost: calcUnitCost(5.50, 1, 'kg'), stockQty: 5, minStockQty: 1 } }),
    prisma.rawMaterial.create({ data: { userId: user.id, name: 'Açúcar refinado', category: 'Açúcares', unit: 'kg', totalCost: 3.20, totalQty: 1, unitCost: calcUnitCost(3.20, 1, 'kg'), stockQty: 3, minStockQty: 0.5 } }),
    prisma.rawMaterial.create({ data: { userId: user.id, name: 'Leite integral', category: 'Laticínios', unit: 'l', totalCost: 4.80, totalQty: 1, unitCost: calcUnitCost(4.80, 1, 'l'), stockQty: 4, minStockQty: 1 } }),
    prisma.rawMaterial.create({ data: { userId: user.id, name: 'Ovo', category: 'Ovos', unit: 'un', totalCost: 0.90, totalQty: 1, unitCost: 0.90, stockQty: 30, minStockQty: 6 } }),
    prisma.rawMaterial.create({ data: { userId: user.id, name: 'Manteiga', category: 'Gorduras', unit: 'g', totalCost: 12.00, totalQty: 200, unitCost: calcUnitCost(12.00, 200, 'g'), stockQty: 400, minStockQty: 100 } }),
    prisma.rawMaterial.create({ data: { userId: user.id, name: 'Chocolate em pó', category: 'Outros', unit: 'g', totalCost: 8.50, totalQty: 200, unitCost: calcUnitCost(8.50, 200, 'g'), stockQty: 600, minStockQty: 200 } }),
  ])
  const [farinha, acucar, leite, ovo, manteiga, chocolate] = mats

  // Produto: Brigadeiro
  const brig = await prisma.product.create({
    data: {
      userId: user.id, name: 'Brigadeiro Gourmet', category: 'Doces',
      marginPct: 45, batchSize: 30, stockQty: 60, minStockQty: 10,
      energyCost: 0.80, gasCost: 1.20, packCost: 0.20, otherCost: 0.50,
      unitCost: 1.80, suggestedPrice: 3.27, profitPerUnit: 1.47,
    },
  })
  await prisma.recipe.create({
    data: {
      productId: brig.id, yieldQty: 30, yieldUnit: 'un',
      laborMinutes: 45, packagingCost: 3.00, extraCost: 1.50,
      items: { create: [
        { rawMaterialId: leite.id,      quantity: 0.395, unitCost: Number(leite.unitCost) },
        { rawMaterialId: acucar.id,     quantity: 0.200, unitCost: Number(acucar.unitCost) },
        { rawMaterialId: chocolate.id,  quantity: 0.100, unitCost: Number(chocolate.unitCost) },
        { rawMaterialId: manteiga.id,   quantity: 0.030, unitCost: Number(manteiga.unitCost) },
      ]},
    },
  })

  // Produto: Bolo de pote
  const bolo = await prisma.product.create({
    data: {
      userId: user.id, name: 'Bolo de Pote', category: 'Bolos',
      marginPct: 40, batchSize: 10, stockQty: 15, minStockQty: 5,
      energyCost: 2.50, gasCost: 1.80, packCost: 0.80, otherCost: 0,
      unitCost: 6.40, suggestedPrice: 10.67, profitPerUnit: 4.27,
    },
  })
  await prisma.recipe.create({
    data: {
      productId: bolo.id, yieldQty: 10, yieldUnit: 'un',
      laborMinutes: 90, packagingCost: 8.00, extraCost: 2.50,
      items: { create: [
        { rawMaterialId: farinha.id, quantity: 0.200, unitCost: Number(farinha.unitCost) },
        { rawMaterialId: acucar.id,  quantity: 0.150, unitCost: Number(acucar.unitCost) },
        { rawMaterialId: leite.id,   quantity: 0.100, unitCost: Number(leite.unitCost) },
        { rawMaterialId: ovo.id,     quantity: 2,     unitCost: Number(ovo.unitCost) },
      ]},
    },
  })

  // Produções demo
  await prisma.production.create({
    data: { userId: user.id, productId: brig.id, qty: 60, status: 'COMPLETED', producedAt: new Date(), totalCost: 108, unitCost: 1.80 },
  })
  await prisma.production.create({
    data: { userId: user.id, productId: bolo.id, qty: 10, status: 'COMPLETED', producedAt: new Date(Date.now() - 86400000), totalCost: 64, unitCost: 6.40 },
  })

  // Ingredientes legado (compatibilidade)
  const fl = await prisma.ingredient.create({ data: { userId: user.id, name: 'Farinha de trigo', unit: 'g', totalCost: 5.50, totalQty: 1000 } })
  const ac = await prisma.ingredient.create({ data: { userId: user.id, name: 'Açúcar refinado', unit: 'g', totalCost: 3.20, totalQty: 1000 } })
  const lt = await prisma.ingredient.create({ data: { userId: user.id, name: 'Leite integral', unit: 'ml', totalCost: 4.80, totalQty: 1000 } })
  const ov = await prisma.ingredient.create({ data: { userId: user.id, name: 'Ovo', unit: 'un', totalCost: 0.90, totalQty: 1 } })

  console.log('✅ Seed concluído!')
  console.log('   Admin:   admin@gestfast.com / admin123456')
  console.log('   Usuário: demo@gestfast.com  / demo123456')
}

main().catch(console.error).finally(() => prisma.$disconnect())
