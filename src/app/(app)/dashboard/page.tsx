import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcProductCost, formatBRL } from '@/lib/pricing'
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

  const products = await prisma.product.findMany({
    where: { userId: session.userId },
    include: { ingredients: { include: { ingredient: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const ingCount = await prisma.ingredient.count({ where: { userId: session.userId } })
  const firstName = user?.name?.split(' ')[0] ?? 'usuário'

  if (products.length === 0) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Olá, {firstName}! 👋</h1>
          <p className="text-slate-400 mt-1 text-sm">Vamos descobrir quanto você pode lucrar com seus produtos.</p>
        </div>

        {/* Hero vazio */}
        <div className="card p-8 text-center mb-6 bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg shadow-blue-100">
          <div className="text-5xl mb-4">💰</div>
          <h2 className="text-xl font-bold text-white mb-2">Descubra quanto você realmente lucra</h2>
          <p className="text-blue-100 text-sm mb-6 leading-relaxed">
            Em menos de 5 minutos você vai saber o custo exato de cada produto e o preço ideal para ter lucro.
          </p>
          <Link href="/ingredients" className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition text-sm shadow-sm">
            Começar agora →
          </Link>
        </div>

        {/* Passos */}
        <div className="card overflow-hidden">
          <div className="section-header">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configure em 3 passos</p>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { num: '1', done: ingCount > 0, icon: '🛒', title: 'Cadastre o que você compra', desc: 'Farinha, açúcar, ovos, embalagem... O sistema calcula o custo por grama automaticamente.', href: '/ingredients', cta: 'Adicionar ingredientes' },
              { num: '2', done: false,         icon: '⚡', title: 'Informe seus custos fixos', desc: 'Gás, energia elétrica, embalagens. Você informa o total e o sistema divide por produto.', href: '/costs', cta: 'Configurar custos' },
              { num: '3', done: false,         icon: '🎂', title: 'Crie seus produtos', desc: 'Adicione os ingredientes de cada receita. O sistema calcula o custo e o preço ideal.', href: '/products/new', cta: 'Criar primeiro produto' },
            ].map(s => (
              <div key={s.num} className={`flex items-start gap-4 p-5 ${s.done ? 'bg-emerald-50/50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${s.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {s.done ? '✓' : s.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm">{s.icon}</span>
                    <p className="font-semibold text-slate-700 text-sm">{s.title}</p>
                    {s.done && <span className="badge-green text-[10px] py-0.5">Feito</span>}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">{s.desc}</p>
                  {!s.done && (
                    <Link href={s.href} className="text-xs font-semibold text-blue-500 hover:text-blue-700 hover:underline">
                      {s.cta} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Com dados — calcular tudo
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

  const profitableCalcs = calcs.filter(c => c.result.unitProfit > 0)
  const lossCalcs       = calcs.filter(c => c.result.unitProfit <= 0)
  const bestProduct     = calcs.reduce((best, c) => c.result.unitProfit > (best?.result.unitProfit ?? -Infinity) ? c : best, calcs[0])
  const avgMargin       = calcs.reduce((a, c) => a + c.product.marginPct, 0) / calcs.length

  // Dados serializáveis para o client component
  const clientProducts = calcs.map(({ product, result }) => ({
    id: product.id,
    name: product.name,
    marginPct: product.marginPct,
    unitCost: result.unitCost,
    suggestedPrice: result.suggestedPrice,
    unitProfit: result.unitProfit,
    status: result.status,
  }))

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Olá, {firstName}! 👋</h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            {lossCalcs.length > 0
              ? `Atenção: ${lossCalcs.length} produto${lossCalcs.length > 1 ? 's estão' : ' está'} te dando prejuízo.`
              : 'Todos os seus produtos estão gerando lucro. Continue assim!'}
          </p>
        </div>
        <Link href="/products/new" className="btn-primary btn-sm hidden sm:inline-flex">
          + Novo produto
        </Link>
      </div>

      {/* ALERTA de prejuízo — máxima prioridade visual */}
      {lossCalcs.map(({ product, result }) => (
        <div key={product.id} className="alert-danger mb-3">
          <span className="text-lg shrink-0">⚠️</span>
          <div className="flex-1">
            <span className="font-bold">"{product.name}" está te dando prejuízo!</span>
            <span className="font-normal ml-1">
              Você perde <strong>{formatBRL(Math.abs(result.unitProfit))}</strong> em cada unidade vendida.
            </span>
          </div>
          <Link href={`/products/${product.id}/edit`} className="shrink-0 text-xs font-bold text-red-600 hover:underline whitespace-nowrap">
            Corrigir →
          </Link>
        </div>
      ))}

      {/* ALERTA de margem baixa */}
      {calcs.filter(c => c.result.status === 'low' && c.result.unitProfit > 0).map(({ product, result }) => (
        <div key={product.id} className="alert-amber mb-3">
          <span className="text-lg shrink-0">📉</span>
          <div className="flex-1">
            <span className="font-bold">"{product.name}" pode render mais.</span>
            <span className="font-normal ml-1">Margem de {product.marginPct}% está abaixo do recomendado (35%).</span>
          </div>
          <Link href="/simulation" className="shrink-0 text-xs font-bold text-amber-700 hover:underline whitespace-nowrap">
            Simular →
          </Link>
        </div>
      ))}

      {/* HERO — Lucro potencial mensal (componente client para vendas/dia) */}
      <DashboardClient products={clientProducts} bestProductName={bestProduct?.product.name ?? ''} avgMargin={avgMargin} />

      {/* Lista de produtos */}
      <div className="card overflow-hidden mt-5">
        <div className="section-header flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seus produtos</p>
          <Link href="/products/new" className="btn-primary btn-sm">+ Novo</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {calcs.map(({ product, result }) => {
            const profitable = result.unitProfit > 0
            const isBest = product.id === bestProduct?.product.id
            return (
              <div key={product.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition ${!profitable ? 'bg-red-50/30' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{product.name}</p>
                    {isBest && profitable && <span className="badge-gold">⭐ Mais lucrativo</span>}
                    {!profitable && <span className="badge-red">❌ Prejuízo</span>}
                    {result.status === 'low' && profitable && <span className="badge-amber">⚠ Margem baixa</span>}
                    {result.status === 'healthy' && profitable && <span className="badge-green">✓ Saudável</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Custa <span className="money">{formatBRL(result.unitCost)}</span>/un. · Venda por{' '}
                    <span className="money font-semibold text-blue-600">{formatBRL(result.suggestedPrice)}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-base font-bold money ${profitable ? 'text-emerald-600' : 'text-red-600'}`}>
                    {profitable ? '+' : ''}{formatBRL(result.unitProfit)}
                  </p>
                  <p className="text-[11px] text-slate-400">por unidade</p>
                </div>
                <Link href={`/products/${product.id}/edit`}
                  className="shrink-0 text-xs text-slate-400 hover:text-blue-500 transition font-medium">
                  Editar →
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
