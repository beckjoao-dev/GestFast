'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-blue-200">
            G
          </div>
          <span className="font-black text-slate-800 tracking-tight">GestFast</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
            Entrar
          </Link>
          <a href="#preco"
            className="btn-primary text-sm px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition active:scale-95 shadow-sm shadow-blue-200">
            Comprar agora
          </a>
        </div>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-32 pb-20 px-5 text-center bg-gradient-to-b from-blue-50/60 to-white">
      <div className="max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Para pequenos produtores e vendedores
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-5">
          Pare de vender{' '}
          <span className="relative inline-block">
            <span className="relative z-10 text-blue-500">sem lucro</span>
            <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-100 rounded -z-0" />
          </span>
        </h1>

        <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-8">
          O GestFast calcula automaticamente o custo de produção e sugere o preço ideal para que você{' '}
          <strong className="text-slate-700">nunca mais venda no prejuízo</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a href="#preco"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-black text-base px-8 py-4 rounded-2xl transition active:scale-95 shadow-lg shadow-blue-200">
            💰 Comprar acesso vitalício
          </a>
          <a href="#como-funciona"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm px-6 py-4 rounded-2xl transition">
            Como funciona →
          </a>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Pagamento único de <strong className="text-slate-600">R$49</strong> · Sem mensalidade · Use para sempre
        </p>
      </div>

      {/* Dashboard mockup */}
      <div className="max-w-4xl mx-auto mt-14">
        <DashboardMockup />
      </div>
    </section>
  )
}

// ─── Dashboard Mockup (produto real simulado) ──────────────────────────────
function DashboardMockup() {
  const products = [
    { name: 'Bolo de Pote',        cost: 6.40,  price: 15.00, profit: 8.60,  status: 'healthy' },
    { name: 'Cookie Artesanal',     cost: 3.20,  price: 8.00,  profit: 4.80,  status: 'healthy' },
    { name: 'Brigadeiro Gourmet',   cost: 1.80,  price: 4.50,  profit: 2.70,  status: 'low'     },
    { name: 'Coxinha de Frango',    cost: 5.10,  price: 4.00,  profit: -1.10, status: 'critical'},
  ]

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200 overflow-hidden text-left">
      {/* Top bar */}
      <div className="bg-slate-800 px-5 py-3 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-slate-400 text-xs font-mono">gestfast.com.br/dashboard</span>
      </div>

      {/* Content */}
      <div className="flex">
        {/* Fake sidebar */}
        <div className="w-44 bg-white border-r border-slate-100 p-3 hidden sm:block shrink-0">
          {['📊 Início','🛒 Ingredientes','⚡ Custos','🎂 Produtos','💡 Simulador'].map((item, i) => (
            <div key={i}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold mb-0.5 ${i === 0 ? 'bg-blue-500 text-white' : 'text-slate-500'}`}>
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 bg-slate-50 min-w-0">
          {/* Hero card verde */}
          <div className="bg-emerald-500 rounded-2xl p-4 mb-4">
            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-wider mb-1">
              💰 Seu potencial de lucro mensal
            </p>
            <p className="text-white text-2xl font-black font-mono">R$ 2.840,00</p>
            <p className="text-emerald-100 text-xs mt-1">Vendendo 20 unidades por dia</p>
          </div>

          {/* Alertas */}
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <p className="text-red-700 text-xs font-semibold">
              "Coxinha de Frango" está te dando <strong>prejuízo de R$ 1,10</strong> por unidade!
            </p>
            <span className="ml-auto text-xs text-red-500 font-bold whitespace-nowrap">Corrigir →</span>
          </div>

          {/* Tabela de produtos */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seus produtos</p>
            </div>
            {products.map((p, i) => (
              <div key={i} className={`flex items-center px-4 py-3 border-b border-slate-50 last:border-0 ${p.status === 'critical' ? 'bg-red-50/30' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400">
                    Custa {fmtBRL(p.cost)} · Venda por{' '}
                    <span className="text-blue-600 font-semibold font-mono">{fmtBRL(p.price)}</span>
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-xs font-black font-mono ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {p.profit >= 0 ? '+' : ''}{fmtBRL(p.profit)}
                  </p>
                  <p className="text-[10px] text-slate-400">por unidade</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Problema → Solução ────────────────────────────────────────────────────
function ProblemSolution() {
  return (
    <section className="py-20 px-5 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">A realidade de muitos vendedores</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Você trabalha muito mas não sabe<br />se está ganhando ou perdendo
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Problema */}
          <div className="bg-red-50 border border-red-100 rounded-3xl p-7">
            <p className="text-red-500 font-black text-sm uppercase tracking-wider mb-5">❌ Sem o GestFast</p>
            <div className="space-y-4">
              {[
                { icon: '🤔', text: 'Você chuta o preço e torce para não perder dinheiro' },
                { icon: '😰', text: 'Não sabe se o custo subiu e está vendendo barato demais' },
                { icon: '😤', text: 'Trabalha muito, vende bastante e o dinheiro some' },
                { icon: '📉', text: 'Desconta o preço para vender mais — e piora o prejuízo' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-slate-700 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solução */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-7">
            <p className="text-emerald-600 font-black text-sm uppercase tracking-wider mb-5">✅ Com o GestFast</p>
            <div className="space-y-4">
              {[
                { icon: '📊', text: 'Sistema calcula o custo exato de cada produto automaticamente' },
                { icon: '💡', text: 'Você vê o preço ideal para ter o lucro que quer' },
                { icon: '💰', text: 'Sabe quanto lucra por unidade e por mês em tempo real' },
                { icon: '🎯', text: 'Toma decisões com dados, não com achismo' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-slate-700 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Como funciona ─────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: '1',
      icon: '🛒',
      title: 'Cadastre o que você compra',
      desc: 'Informe os ingredientes ou materiais: o nome, quanto pagou e a quantidade. O sistema calcula o custo por grama automaticamente.',
      detail: 'Ex: 1kg de farinha por R$ 5,50 → R$ 0,0055/g',
    },
    {
      num: '2',
      icon: '🎂',
      title: 'Crie seus produtos',
      desc: 'Selecione os ingredientes que usa em cada receita e a quantidade. Adicione custos de gás, energia e embalagem.',
      detail: 'Leva menos de 2 minutos por produto',
    },
    {
      num: '3',
      icon: '💰',
      title: 'Veja seu lucro real',
      desc: 'O sistema mostra o custo por unidade, o preço ideal para ter lucro e quanto você pode ganhar por mês.',
      detail: 'Atualiza em tempo real conforme você preenche',
    },
  ]

  return (
    <section id="como-funciona" className="py-20 px-5 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Simples assim</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Como funciona em 3 passos</h2>
          <p className="text-slate-400 mt-3">Você não precisa entender de matemática. O sistema faz tudo por você.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 relative">
              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-3 z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-black">→</span>
                </div>
              )}
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <span className="text-xl">{step.icon}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">
                  Passo {step.num}
                </span>
              </div>
              <h3 className="font-black text-slate-800 mb-2 text-base">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-3">{step.desc}</p>
              <p className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-2 rounded-xl">
                💡 {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Benefícios ────────────────────────────────────────────────────────────
function Benefits() {
  const items = [
    { icon: '🛡️', title: 'Nunca mais ter prejuízo',    desc: 'Alertas automáticos quando um produto está te dando prejuízo.' },
    { icon: '🎯', title: 'Preço certo, sempre',         desc: 'Sistema calcula o preço ideal com base no seu custo real.' },
    { icon: '📈', title: 'Veja quanto vai ganhar',      desc: 'Projeta sua renda mensal com base nas suas vendas diárias.' },
    { icon: '⚡', title: 'Rápido e simples',            desc: 'Interface feita para quem não tem tempo nem quer complicação.' },
    { icon: '📱', title: 'Funciona no celular',         desc: 'Acesse de qualquer lugar, no celular ou computador.' },
    { icon: '♾️', title: 'Sem mensalidade',             desc: 'Pague uma vez e use para sempre. Sem cobrança recorrente.' },
  ]

  return (
    <section className="py-20 px-5 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Por que usar o GestFast</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Tudo que você precisa para precificar certo
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-xl shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Simulação de lucro interativa ────────────────────────────────────────
function ProfitSimulator() {
  const [qty, setQty] = useState(20)
  const unitProfit = 4.80
  const daily      = qty * unitProfit
  const monthly    = daily * 26

  return (
    <section className="py-20 px-5 bg-gradient-to-br from-blue-600 to-blue-700">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-3">Simulação de lucro</p>
        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
          Veja quanto você pode ganhar
        </h2>
        <p className="text-blue-200 text-sm mb-10">
          Exemplo com Bolo de Pote: custo R$ 6,40 · preço de venda R$ 11,20 · lucro R$ 4,80/un.
        </p>

        <div className="bg-white/10 backdrop-blur rounded-3xl p-7 mb-8 border border-white/20">
          <p className="text-blue-100 text-sm font-semibold mb-3">
            Quantas unidades você vende por dia?
          </p>
          <div className="flex items-center gap-4 mb-4">
            <input type="range" min="1" max="100" step="1" value={qty}
              onChange={e => setQty(parseInt(e.target.value))}
              className="flex-1 accent-emerald-400 cursor-pointer" />
            <span className="text-white text-xl font-black w-20 text-right font-mono">{qty} un.</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Por dia',  value: fmtBRL(daily) },
              { label: 'Por mês',  value: fmtBRL(monthly), highlight: true },
              { label: 'Por ano',  value: fmtBRL(monthly * 12) },
            ].map(item => (
              <div key={item.label} className={`rounded-2xl p-4 ${item.highlight ? 'bg-emerald-400' : 'bg-white/10'}`}>
                <p className={`text-xs font-semibold mb-1 ${item.highlight ? 'text-emerald-900' : 'text-blue-200'}`}>
                  {item.label}
                </p>
                <p className={`text-lg font-black font-mono ${item.highlight ? 'text-emerald-900' : 'text-white'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200 text-sm">
          Com o GestFast você descobre exatamente esse número para <strong className="text-white">cada produto seu</strong>.
        </p>
      </div>
    </section>
  )
}

// ─── Prova social / Confiança ──────────────────────────────────────────────
function Trust() {
  const testimonials = [
    {
      name: 'Ana Silva',
      role: 'Vende bolos de pote em casa',
      text: 'Eu vendia meu bolo por R$10 achando que ganhava dinheiro. O sistema mostrou que meu custo real era R$9,20. Eu estava quase no prejuízo sem saber!',
      result: 'Ajustou para R$15 e triplicou o lucro',
    },
    {
      name: 'Marcos Oliveira',
      role: 'Produz salgados artesanais',
      text: 'Nunca soube calcular direito. Tinha medo de cobrar mais caro e perder clientes. Com o sistema vi que estava cobrando barato demais e ninguém reclamou quando aumentei.',
      result: 'Aumentou 30% na margem de lucro',
    },
    {
      name: 'Fernanda Costa',
      role: 'Confeitaria em casa',
      text: 'O melhor é que é simples de usar. Não precisa saber de matemática. Você coloca os dados e o sistema faz tudo. Em 10 minutos já vi o preço certo de 5 produtos.',
      result: 'Configurou tudo em menos de 20 minutos',
    },
  ]

  return (
    <section className="py-20 px-5 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Feito para você</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Quem usa o GestFast?
          </h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Vendedores de comida caseira, confeiteiros, salgadeiros, artesãos — qualquer pessoa que produz e vende.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex mb-3">
                {[...Array(5)].map((_, s) => (
                  <span key={s} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="border-t border-slate-100 pt-4">
                <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                <p className="text-slate-400 text-xs mb-2">{t.role}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  ✓ {t.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Preço ─────────────────────────────────────────────────────────────────
function Pricing() {
  const features = [
    'Cadastro ilimitado de ingredientes',
    'Cadastro ilimitado de produtos',
    'Cálculo automático de custo e preço',
    'Simulador de lucro mensal',
    'Alertas de prejuízo e margem baixa',
    'Gestão de custos operacionais',
    'Dashboard com visão completa',
    'Funciona no celular e computador',
    'Atualizações incluídas para sempre',
    'Sem mensalidade — pague uma vez',
  ]

  return (
    <section id="preco" className="py-20 px-5 bg-white">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Investimento único</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Acesso vitalício ao GestFast
          </h2>
          <p className="text-slate-400 mt-3">
            Pague uma vez. Use para sempre. Sem surpresas.
          </p>
        </div>

        {/* Card de preço */}
        <div className="relative bg-white rounded-3xl border-2 border-blue-500 shadow-xl shadow-blue-100 overflow-hidden">
          {/* Faixa topo */}
          <div className="bg-blue-500 text-white text-center py-2.5 text-xs font-black uppercase tracking-widest">
            ♾️ Acesso vitalício — pague uma vez
          </div>

          <div className="p-8">
            {/* Preço */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-slate-400 text-base line-through">R$ 97</span>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-full border border-emerald-100">
                  50% OFF
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-bold text-slate-500">R$</span>
                <span className="text-7xl font-black text-slate-900 tracking-tight leading-none">49</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">pagamento único · sem mensalidade</p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-emerald-600 text-[10px] font-black">✓</span>
                  </div>
                  <span className="text-slate-700 text-sm">{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="https://buy.stripe.com/seu-link-aqui"
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-black text-lg py-4 rounded-2xl transition active:scale-[.98] shadow-lg shadow-blue-200 mb-4">
              Comprar agora por R$ 49
            </a>

            {/* Garantias */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '🔒', text: 'Pagamento seguro' },
                { icon: '♾️', text: 'Acesso vitalício' },
                { icon: '📱', text: 'Funciona no celular' },
              ].map((g, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-base mb-1">{g.icon}</p>
                  <p className="text-[11px] text-slate-500 font-semibold leading-tight">{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Argumento de valor */}
        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
          <p className="text-amber-800 font-bold text-sm mb-1">💡 Pense assim</p>
          <p className="text-amber-700 text-sm leading-relaxed">
            Um único erro de precificação pode te custar{' '}
            <strong>R$ 100, R$ 300, R$ 500</strong> por mês sem você perceber.
            O GestFast custa R$ 49 uma vez e te protege para sempre.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ───────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  const items = [
    {
      q: 'Preciso entender de matemática para usar?',
      a: 'Não. Você apenas preenche os dados (nome, preço que pagou, quantidade). O sistema faz todos os cálculos automaticamente.',
    },
    {
      q: 'Funciona para qualquer tipo de produto?',
      a: 'Sim. Funciona para bolos, salgados, doces, brigadeiros, artesanatos, cosméticos caseiros — qualquer produto que você produz e vende.',
    },
    {
      q: 'Como funciona o acesso vitalício?',
      a: 'Você paga R$ 49 uma única vez e tem acesso completo para sempre. Sem mensalidade, sem renovação, sem surpresa.',
    },
    {
      q: 'Posso usar no celular?',
      a: 'Sim. O sistema é responsivo e funciona perfeitamente no celular, tablet e computador.',
    },
    {
      q: 'Como recebo o acesso?',
      a: 'Após o pagamento confirmado, você recebe as credenciais de acesso por e-mail em até alguns minutos.',
    },
  ]

  return (
    <section className="py-20 px-5 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Perguntas frequentes</h2>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer"
              onClick={() => setOpen(open === i ? null : i)}>
              <div className="flex items-center justify-between px-5 py-4">
                <p className="font-semibold text-slate-800 text-sm pr-4">{item.q}</p>
                <span className={`text-slate-400 transition-transform shrink-0 ${open === i ? 'rotate-45' : ''}`}>
                  +
                </span>
              </div>
              {open === i && (
                <div className="px-5 pb-4 text-slate-500 text-sm leading-relaxed border-t border-slate-50">
                  <p className="pt-3">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Final ─────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-20 px-5 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Chega de prejuízo</p>
        <h2 className="text-3xl font-black text-white tracking-tight mb-4">
          Comece agora e descubra<br />seu lucro real
        </h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Em menos de 10 minutos você vai saber exatamente quanto custa produzir cada produto e qual é o preço ideal para ter lucro.
        </p>
        <a
          href="https://buy.stripe.com/seu-link-aqui"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-black text-lg px-10 py-4 rounded-2xl transition active:scale-95 shadow-xl shadow-blue-900/30 mb-4">
          💰 Comprar acesso vitalício — R$ 49
        </a>
        <p className="text-slate-500 text-sm">
          Pagamento único · Sem mensalidade · Acesso imediato
        </p>
      </div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 px-5 py-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white font-black text-xs">
            G
          </div>
          <span className="font-bold text-white text-sm">GestFast</span>
          <span className="text-slate-500 text-xs">— Precificação para pequenos vendedores</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-slate-400 hover:text-white text-xs transition">
            Entrar no sistema
          </Link>
          <a href="mailto:contato@gestfast.com.br" className="text-slate-400 hover:text-white text-xs transition">
            Contato
          </a>
        </div>
      </div>
    </footer>
  )
}

// ─── Página completa ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <Benefits />
      <ProfitSimulator />
      <Trust />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
