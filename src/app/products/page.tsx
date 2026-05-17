import AppShell from '@/components/AppShell'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fmtBRL } from '@/services/cost-calculator'
import { calcProductCost } from '@/lib/pricing'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeleteProductButton from '@/components/DeleteProductButton'

export default async function ProductsPage() {
  const session = getCurrentUser()
  if (!session) redirect('/login')

  const products = await prisma.product.findMany({
    where: { userId: session.userId },
    include: {
      ingredients: { include: { ingredient: true } },
      recipe:      { select: { id: true, yieldQty: true, yieldUnit: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <AppShell>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">🎂 Produtos</h1>
            <p className="text-slate-400 text-sm mt-0.5">Catálogo com custos e preços calculados automaticamente.</p>
          </div>
          <Link href="/products/new" className="btn-primary">+ Novo produto</Link>
        </div>

        {products.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">🎂</div>
            <h3 className="font-bold text-slate-700 mb-2">Nenhum produto cadastrado</h3>
            <p className="text-slate-400 text-sm mb-5">Crie um produto e adicione a ficha técnica para calcular o custo automaticamente.</p>
            <Link href="/products/new" className="btn-primary">Criar primeiro produto</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(p => {
              const result = calcProductCost({
                ingredients: p.ingredients.map(pi => ({
                  totalCost: pi.ingredient.totalCost,
                  totalQty:  pi.ingredient.totalQty,
                  quantity:  pi.quantity,
                })),
                energyCost: p.energyCost, gasCost: p.gasCost,
                packCost:   p.packCost,   otherCost: p.otherCost,
                batchSize:  p.batchSize,  marginPct: p.marginPct,
              })
              const profitable = result.unitProfit > 0
              const hasRecipe  = !!p.recipe

              return (
                <div key={p.id} className="card overflow-hidden hover:shadow-md transition">
                  <div className={`h-1 ${profitable
                    ? result.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
                    : 'bg-red-400'}`} />
                  <div className="p-5 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Link href={`/products/${p.id}`}
                          className="font-bold text-slate-800 hover:text-blue-600 transition">
                          {p.name}
                        </Link>
                        {!profitable && <span className="badge-red">❌ Prejuízo</span>}
                        {profitable && result.status === 'healthy' && <span className="badge-green">✓ Saudável</span>}
                        {profitable && result.status === 'low' && <span className="badge-amber">⚠ Margem baixa</span>}
                        {!hasRecipe && <span className="badge-blue">📋 Sem ficha técnica</span>}
                        {p.timeMinutes && <span className="text-xs text-slate-400">⏱ {p.timeMinutes}min</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Custa fazer',   value: fmtBRL(result.unitCost),       color: 'text-slate-700' },
                          { label: 'Preço ideal',   value: fmtBRL(result.suggestedPrice), color: 'text-blue-600'  },
                          { label: profitable ? 'Lucro/un.' : 'Prejuízo/un.',
                            value: (profitable ? '+' : '') + fmtBRL(result.unitProfit),
                            color: profitable ? 'text-emerald-600' : 'text-red-600' },
                        ].map(item => (
                          <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-[10px] text-slate-400 mb-0.5">{item.label}</p>
                            <p className={`text-sm font-bold money ${item.color}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/products/${p.id}`}
                        className="btn-primary btn-sm text-xs">
                        {hasRecipe ? '📋 Ficha técnica' : '+ Ficha técnica'}
                      </Link>
                      <Link href={`/products/${p.id}/edit`} className="btn-outline btn-sm text-xs">Editar</Link>
                      <DeleteProductButton productId={p.id} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
