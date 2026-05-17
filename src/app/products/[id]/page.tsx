import AppShell from '@/components/AppShell'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import RecipeForm from '@/components/RecipeForm'
import { fmtBRL } from '@/services/cost-calculator'
import Link from 'next/link'

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const session = getCurrentUser()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.userId } })

  const [product, rawMaterials] = await Promise.all([
    prisma.product.findFirst({
      where: { id: params.id, userId: session.userId },
      include: {
        recipe: { include: { items: { include: { rawMaterial: true } } } },
        priceHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    }),
    prisma.rawMaterial.findMany({
      where: { userId: session.userId },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!product) notFound()

  const profitPerUnit  = Number(product.profitPerUnit)
  const unitCost       = Number(product.unitCost)
  const suggestedPrice = Number(product.suggestedPrice)
  const marginPct      = suggestedPrice > 0 ? (profitPerUnit / suggestedPrice) * 100 : 0
  const hasProfit      = profitPerUnit > 0

  return (
    <AppShell>
      <div className="p-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/products" className="text-slate-400 hover:text-slate-600 text-sm">← Produtos</Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>
            {product.category && <p className="text-slate-400 text-sm mt-0.5">{product.category}</p>}
          </div>
          <Link href={`/products/${product.id}/edit`} className="btn-outline shrink-0">Editar produto</Link>
        </div>

        {/* Cards de resultado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card-p">
            <p className="text-xs text-slate-400 mb-1">Custa fazer</p>
            <p className="text-lg font-black money text-slate-800">{fmtBRL(unitCost)}</p>
            <p className="text-[11px] text-slate-400">por unidade</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs text-blue-500 mb-1">Preço ideal</p>
            <p className="text-lg font-black money text-blue-600">{fmtBRL(suggestedPrice)}</p>
            <p className="text-[11px] text-blue-400">{Number(product.marginPct)}% margem</p>
          </div>
          <div className={`rounded-2xl p-4 border ${hasProfit ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-xs mb-1 ${hasProfit ? 'text-emerald-500' : 'text-red-500'}`}>
              {hasProfit ? 'Lucro/un.' : 'Prejuízo/un.'}
            </p>
            <p className={`text-lg font-black money ${hasProfit ? 'text-emerald-600' : 'text-red-600'}`}>
              {hasProfit ? '+' : ''}{fmtBRL(profitPerUnit)}
            </p>
            <p className={`text-[11px] ${hasProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {marginPct.toFixed(1)}% real
            </p>
          </div>
          <div className="card-p">
            <p className="text-xs text-slate-400 mb-1">Em estoque</p>
            <p className="text-lg font-black money text-slate-800">{Number(product.stockQty)}</p>
            <p className="text-[11px] text-slate-400">unidades</p>
          </div>
        </div>

        {/* Ficha técnica */}
        <div className="card overflow-hidden mb-5">
          <div className="section-header flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">📋 Ficha técnica</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {product.recipe ? 'Editando ficha existente' : 'Cadastre para calcular o custo automaticamente'}
              </p>
            </div>
            {!product.recipe && rawMaterials.length === 0 && (
              <Link href="/stock" className="btn-outline btn-sm text-xs">Cadastrar ingredientes →</Link>
            )}
          </div>
          <div className="p-5">
            <RecipeForm
              productId={product.id}
              productName={product.name}
              rawMaterials={rawMaterials}
              initialRecipe={product.recipe}
              laborCostPerHour={Number(user?.laborCostPerHour ?? 0)}
            />
          </div>
        </div>

        {/* Histórico de preços */}
        {product.priceHistory.length > 0 && (
          <div className="card overflow-hidden">
            <div className="section-header">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Histórico de custo</p>
            </div>
            <div className="divide-y divide-slate-50">
              {product.priceHistory.map((h, i) => (
                <div key={h.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Custo: {fmtBRL(Number(h.unitCost))} · Preço: {fmtBRL(Number(h.salePrice))}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${Number(h.marginPct) >= 35 ? 'text-emerald-600' : Number(h.marginPct) >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                      {Number(h.marginPct).toFixed(1)}%
                    </p>
                    {i === 0 && <span className="badge-blue text-[10px]">Atual</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
