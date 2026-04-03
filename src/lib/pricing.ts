// ─────────────────────────────────────────────────────────────────────────────
// pricing.ts — motor central de cálculo do GestFast
// Toda alteração aqui reflete em ProductForm, SimulationClient e Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export interface IngredientUsage {
  totalCost: number
  totalQty:  number
  quantity:  number // quantidade usada no produto (na unidade do ingrediente)
}

export interface ProductCostInput {
  ingredients: IngredientUsage[]
  energyCost:  number
  gasCost:     number
  packCost:    number
  otherCost:   number
  batchSize:   number
  marginPct:   number
}

// Breakdown individual de cada categoria — usado pelos gráficos
export interface CostBreakdown {
  ingredients: number
  energy:      number
  gas:         number
  packaging:   number
  other:       number
}

// Insights gerados automaticamente a partir do custo
export interface CostInsight {
  type:    'info' | 'warn' | 'danger'
  message: string
}

export interface ProductCostResult {
  // Custos do lote
  ingredientCost:  number
  extraCost:       number
  totalBatchCost:  number
  // Por unidade
  unitCost:        number
  suggestedPrice:  number
  unitProfit:      number
  marginDecimal:   number
  // Status e breakdown
  status:          'healthy' | 'low' | 'critical'
  breakdown:       CostBreakdown        // novo: detalhamento por categoria
  breakdownPct:    CostBreakdown        // novo: percentual de cada categoria
  insights:        CostInsight[]        // novo: análise automática
}

/**
 * Fórmula central: preço = custo / (1 - margem)
 * Fonte única de verdade para todos os cálculos do sistema.
 */
export function calcProductCost(input: ProductCostInput): ProductCostResult {
  const batchSize = Math.max(1, input.batchSize)

  // ── Ingredientes ──────────────────────────────────────────────────────────
  const ingredientCost = input.ingredients.reduce((acc, ing) => {
    if (ing.totalQty <= 0) return acc // guarda contra divisão por zero
    return acc + (ing.totalCost / ing.totalQty) * ing.quantity
  }, 0)

  // ── Custos extras (guardar valores individuais para breakdown) ────────────
  const energy    = Math.max(0, input.energyCost)
  const gas       = Math.max(0, input.gasCost)
  const packaging = Math.max(0, input.packCost)
  const other     = Math.max(0, input.otherCost)
  const extraCost = energy + gas + packaging + other

  // ── Totais ────────────────────────────────────────────────────────────────
  const totalBatchCost = ingredientCost + extraCost
  const unitCost       = totalBatchCost / batchSize

  // ── Precificação ──────────────────────────────────────────────────────────
  const marginDecimal  = Math.min(0.99, Math.max(0.01, input.marginPct / 100))
  const suggestedPrice = unitCost > 0 ? unitCost / (1 - marginDecimal) : 0
  const unitProfit     = suggestedPrice - unitCost

  // ── Status ────────────────────────────────────────────────────────────────
  const status: ProductCostResult['status'] =
    input.marginPct >= 35 ? 'healthy' :
    input.marginPct >= 20 ? 'low'     : 'critical'

  // ── Breakdown absoluto (por lote) ─────────────────────────────────────────
  const breakdown: CostBreakdown = {
    ingredients: ingredientCost,
    energy,
    gas,
    packaging,
    other,
  }

  // ── Breakdown percentual ──────────────────────────────────────────────────
  const safeTotal = totalBatchCost > 0 ? totalBatchCost : 1
  const breakdownPct: CostBreakdown = {
    ingredients: (ingredientCost / safeTotal) * 100,
    energy:      (energy         / safeTotal) * 100,
    gas:         (gas            / safeTotal) * 100,
    packaging:   (packaging      / safeTotal) * 100,
    other:       (other          / safeTotal) * 100,
  }

  // ── Insights automáticos ─────────────────────────────────────────────────
  const insights: CostInsight[] = generateInsights({
    breakdown,
    breakdownPct,
    marginPct: input.marginPct,
    totalBatchCost,
    unitCost,
    suggestedPrice,
  })

  return {
    ingredientCost,
    extraCost,
    totalBatchCost,
    unitCost,
    suggestedPrice,
    unitProfit,
    marginDecimal,
    status,
    breakdown,
    breakdownPct,
    insights,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// generateInsights — analisa o breakdown e produz alertas legíveis
// ─────────────────────────────────────────────────────────────────────────────
interface InsightInput {
  breakdown:       CostBreakdown
  breakdownPct:    CostBreakdown
  marginPct:       number
  totalBatchCost:  number
  unitCost:        number
  suggestedPrice:  number
}

function generateInsights(data: InsightInput): CostInsight[] {
  const insights: CostInsight[] = []
  const { breakdown, breakdownPct, marginPct } = data

  // Maior custo do lote
  const costEntries: [keyof CostBreakdown, string][] = [
    ['ingredients', 'Ingredientes'],
    ['energy',      'Energia'],
    ['gas',         'Gás'],
    ['packaging',   'Embalagem'],
    ['other',       'Outros'],
  ]

  const nonZero = costEntries.filter(([k]) => breakdown[k] > 0)
  if (nonZero.length > 0) {
    const [topKey, topLabel] = nonZero.reduce((max, cur) =>
      breakdown[cur[0]] > breakdown[max[0]] ? cur : max
    )
    const pct = breakdownPct[topKey]
    if (pct > 50) {
      insights.push({
        type: 'info',
        message: `Maior custo: ${topLabel} representa ${pct.toFixed(0)}% do total`,
      })
    }
  }

  // Embalagem cara
  if (breakdownPct.packaging >= 15) {
    insights.push({
      type: 'warn',
      message: `Embalagem representa ${breakdownPct.packaging.toFixed(0)}% do custo — considere negociar fornecedores`,
    })
  }

  // Energia alta
  if (breakdownPct.energy >= 20) {
    insights.push({
      type: 'warn',
      message: `Energia representa ${breakdownPct.energy.toFixed(0)}% do custo — verifique horários de produção`,
    })
  }

  // Margem crítica
  if (marginPct < 20) {
    insights.push({
      type: 'danger',
      message: `Margem de ${marginPct}% é muito baixa — risco real de prejuízo com imprevistos`,
    })
  } else if (marginPct < 35) {
    insights.push({
      type: 'warn',
      message: `Margem de ${marginPct}% está abaixo do recomendado (35%)`,
    })
  }

  // Produto sem custo nenhum
  if (data.totalBatchCost === 0) {
    insights.push({
      type: 'warn',
      message: 'Nenhum custo informado — adicione ingredientes ou custos adicionais',
    })
  }

  return insights
}

// ─────────────────────────────────────────────────────────────────────────────
// simulateMargin — reutiliza calcProductCost com margem diferente
// ─────────────────────────────────────────────────────────────────────────────
export function simulateMargin(
  baseInput: Omit<ProductCostInput, 'marginPct'>,
  marginPct: number
): ProductCostResult {
  return calcProductCost({ ...baseInput, marginPct })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de formatação
// ─────────────────────────────────────────────────────────────────────────────
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Retorna as categorias de custo em ordem decrescente de valor (útil para gráficos)
export function sortedBreakdown(
  breakdown: CostBreakdown,
  breakdownPct: CostBreakdown
): { key: keyof CostBreakdown; label: string; value: number; pct: number; color: string }[] {
  const map: { key: keyof CostBreakdown; label: string; color: string }[] = [
    { key: 'ingredients', label: 'Ingredientes', color: '#7c6af7' },
    { key: 'energy',      label: 'Energia',      color: '#f5a623' },
    { key: 'gas',         label: 'Gás',           color: '#4a9eff' },
    { key: 'packaging',   label: 'Embalagem',     color: '#3ecf8e' },
    { key: 'other',       label: 'Outros',        color: '#888' },
  ]
  return map
    .map(item => ({
      ...item,
      value: breakdown[item.key],
      pct:   breakdownPct[item.key],
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
}
