import AppShell from '@/components/AppShell'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fmtBRL } from '@/services/cost-calculator'
import { calcProductCost } from '@/lib/pricing'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const session = getCurrentUser()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  })

  const [products, rawMaterials, recentProductions, alerts] = await Promise.all([
    prisma.product.findMany({
      where: { userId: session.userId },
      include: { ingredients: { include: { ingredient: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.rawMaterial.findMany({
      where: { userId: session.userId },
    }),
    prisma.production.findMany({
      where: { userId: session.userId },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.alert.findMany({
      where: { userId: session.userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const calcs = products.map(p => ({
    product: p,
    result: calcProductCost({
      ingredients: p.ingredients.map(pi => ({
        totalCost: pi.ingredient.totalCost,
        totalQty:  pi.ingredient.totalQty,
        quantity:  pi.quantity,
      })),
      energyCost: p.energyCost, gasCost: p.gasCost,
      packCost:   p.packCost,   otherCost: p.otherCost,
      batchSize:  p.batchSize,  marginPct: p.marginPct,
    }),
  }))

  const firstName = user?.name?.split(' ')[0] ?? 'usuário'
  const lossCalcs = calcs.filter(c => c.result.unitProfit <= 0)
  const lowMargin = calcs.filter(c => c.result.unitProfit > 0 && c.result.status === 'low')
  const bestProduct = calcs.length > 0
    ? calcs.reduce((best, c) => c.result.unitProfit > best.result.unitProfit ? c : best, calcs[0])
    : null
  const avgMargin = calcs.length > 0
    ? calcs.reduce((a, c) => a + c.product.marginPct, 0) / calcs.length
    : 0
  const lowStockMaterials = rawMaterials.filter(m =>
    Number(m.minStockQty) > 0 && Number(m.stockQty) <= Number(m.minStockQty)
  )
  const totalStockValue = rawMaterials.reduce((a, m) =>
    a + Number(m.stockQty) * Number(m.unitCost), 0
  )

  const clientProducts = calcs.map(({ product, result }) => ({
    id: product.id, name: product.name, marginPct: product.marginPct,
    unitCost: result.unitCost, suggestedPrice: result.suggestedPrice,
    unitProfit: result.unitProfit, status: result.status,
  }))

  return (
    <AppShell>
      <div className="p-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Olá, {firstName}! 👋</h1>
            <p className="text-slate-400 mt-0.5 text-sm">
              {lossCalcs.length > 0
                ? `⚠️ ${lossCalcs.length} produto(s) com prejuízo precisam de atenção.`
                : lowStockMaterials.length > 0
                ? `📦 ${lowStockMaterials.length} matéria(s)-prima com estoque baixo.`
                : '✅ Tudo em ordem. Continue assim!'}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/stock" className="btn-outline btn-sm hidden sm:inline-flex">+ Estoque</Link>
            <Link href="/products/new" className="btn-primary btn-sm">+ Produto</Link>
          </div>
        </div>

        {/* Alertas críticos */}
        {lossCalcs.map(({ product, result }) => (
          <div key={product.id} className="alert-danger mb-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div className="flex-1">
              <span className="font-bold">"{product.name}"</span>
              <span className="ml-1">está te dando prejuízo de <strong>{fmtBRL(Math.abs(result.unitProfit))}</strong>/unidade.</span>
            </div>
            <Link href={`/products/${product.id}`} className="text-xs font-bold text-red-600 hover:underline whitespace-nowrap">Corrigir →</Link>
          </div>
        ))}

        {lowStockMaterials.slice(0, 2).map(m => (
          <div key={m.id} className="alert-amber mb-3">
            <span className="text-lg shrink-0">📦</span>
            <div className="flex-1">
              <span className="font-bold">Estoque baixo:</span>
              <span className="ml-1">"{m.name}" — {Number(m.stockQty)}{m.unit} restantes (mínimo: {Number(m.minStockQty)}{m.unit})</span>
            </div>
            <Link href="/stock" className="text-xs font-bold text-amber-700 hover:underline whitespace-nowrap">Repor →</Link>
          </div>
        ))}

        {/* Stats principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="card-p">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Produtos</p>
            <p className="text-2xl font-black text-blue-500">{products.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">{calcs.filter(c => c.result.unitProfit > 0).length} lucrativos</p>
          </div>
          <div className="card-p">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Margem média</p>
            <p className={`text-2xl font-black ${avgMargin >= 35 ? 'text-emerald-500' : avgMargin >= 20 ? 'text-amber-500' : 'text-red-500'}`}>
              {avgMargin.toFixed(0)}%
            </p>
            <p className="text-xs text-slate-400 mt-0.5">meta: 35%+</p>
          </div>
          <div className="card-p">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Valor em estoque</p>
            <p className="text-2xl font-black text-slate-800">{fmtBRL(totalStockValue)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{rawMaterials.length} matérias-primas</p>
          </div>
          <div className={`card-p ${lowStockMaterials.length > 0 ? 'border-amber-200 bg-amber-50/30' : ''}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Estoque baixo</p>
            <p className={`text-2xl font-black ${lowStockMaterials.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {lowStockMaterials.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{lowStockMaterials.length === 0 ? 'tudo ok' : 'requerem reposição'}</p>
          </div>
        </div>

        {/* Projeção de lucro */}
        {clientProducts.length > 0 && (
          <div className="mb-5">
            <DashboardClient
              products={clientProducts}
              bestProductName={bestProduct?.product.name ?? ''}
              avgMargin={avgMargin}
            />
          </div>
        )}

        {/* Grid inferior */}
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Produtos mais lucrativos */}
          <div className="card overflow-hidden">
            <div className="section-header flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produtos</p>
              <Link href="/products" className="text-xs text-blue-500 font-semibold hover:underline">Ver todos →</Link>
            </div>
            {calcs.length === 0 ? (
              <div className="py-10 text-center text-slate-300">
                <div className="text-3xl mb-2">🎂</div>
                <p className="text-sm mb-3">Nenhum produto ainda.</p>
                <Link href="/products/new" className="btn-primary btn-sm">Criar produto</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {calcs.slice(0, 5).map(({ product, result }) => {
                  const profitable = result.unitProfit > 0
                  const isBest = product.id === bestProduct?.product.id
                  return (
                    <Link key={product.id} href={`/products/${product.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-800 text-sm truncate">{product.name}</p>
                          {isBest && profitable && <span className="text-amber-400 text-xs">⭐</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Custa {fmtBRL(result.unitCost)} · Venda {fmtBRL(result.suggestedPrice)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-black money ${profitable ? 'text-emerald-600' : 'text-red-600'}`}>
                          {profitable ? '+' : ''}{fmtBRL(result.unitProfit)}
                        </p>
                        <p className="text-[11px] text-slate-400">/unidade</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Produções recentes + estoque baixo */}
          <div className="space-y-4">

            {/* Produções recentes */}
            <div className="card overflow-hidden">
              <div className="section-header flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produções recentes</p>
                <Link href="/production" className="text-xs text-blue-500 font-semibold hover:underline">Ver todas →</Link>
              </div>
              {recentProductions.length === 0 ? (
                <div className="py-8 text-center text-slate-300">
                  <p className="text-sm">Nenhuma produção registrada.</p>
                  <Link href="/production" className="text-xs text-blue-500 font-semibold hover:underline mt-1 inline-block">Registrar →</Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentProductions.map(prod => (
                    <div key={prod.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{prod.product.name}</p>
                        <p className="text-xs text-slate-400">{new Date(prod.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <p className="text-sm font-bold money text-slate-700">{Number(prod.qty)} un.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estoque baixo */}
            {lowStockMaterials.length > 0 && (
              <div className="card overflow-hidden">
                <div className="section-header">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">⚠ Repor estoque</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {lowStockMaterials.slice(0, 4).map(m => (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3">
                      <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                      <div className="text-right">
                        <p className="text-sm font-bold money text-amber-600">{Number(m.stockQty)}{m.unit}</p>
                        <p className="text-xs text-slate-400">min: {Number(m.minStockQty)}{m.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
