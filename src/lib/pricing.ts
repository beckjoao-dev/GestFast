/**
 * pricing.ts — mantido para compatibilidade com código legado.
 * Novas funcionalidades devem usar src/services/cost-calculator.ts
 */

export interface IngredientUsage {
  totalCost: number
  totalQty:  number
  quantity:  number
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

export interface CostBreakdown {
  ingredients: number
  energy:      number
  gas:         number
  packaging:   number
  other:       number
}

export interface CostInsight {
  type:    'info' | 'warn' | 'danger'
  message: string
}

export interface ProductCostResult {
  ingredientCost:  number
  extraCost:       number
  totalBatchCost:  number
  unitCost:        number
  suggestedPrice:  number
  unitProfit:      number
  marginDecimal:   number
  status:          'healthy' | 'low' | 'critical'
  breakdown:       CostBreakdown
  breakdownPct:    CostBreakdown
  insights:        CostInsight[]
}

export function calcProductCost(input: ProductCostInput): ProductCostResult {
  const batchSize = Math.max(1, input.batchSize)

  const ingredientCost = input.ingredients.reduce((acc, ing) => {
    if (ing.totalQty <= 0) return acc
    return acc + (ing.totalCost / ing.totalQty) * ing.quantity
  }, 0)

  const energy    = Math.max(0, input.energyCost)
  const gas       = Math.max(0, input.gasCost)
  const packaging = Math.max(0, input.packCost)
  const other     = Math.max(0, input.otherCost)
  const extraCost = energy + gas + packaging + other

  const totalBatchCost = ingredientCost + extraCost
  const unitCost       = totalBatchCost / batchSize
  const marginDecimal  = Math.min(0.99, Math.max(0.01, input.marginPct / 100))
  const suggestedPrice = unitCost > 0 ? unitCost / (1 - marginDecimal) : 0
  const unitProfit     = suggestedPrice - unitCost

  const status: ProductCostResult['status'] =
    input.marginPct >= 35 ? 'healthy' :
    input.marginPct >= 20 ? 'low'     : 'critical'

  const safeTotal = totalBatchCost > 0 ? totalBatchCost : 1
  const breakdown: CostBreakdown = { ingredients: ingredientCost, energy, gas, packaging, other }
  const breakdownPct: CostBreakdown = {
    ingredients: (ingredientCost / safeTotal) * 100,
    energy:      (energy         / safeTotal) * 100,
    gas:         (gas            / safeTotal) * 100,
    packaging:   (packaging      / safeTotal) * 100,
    other:       (other          / safeTotal) * 100,
  }

  const insights: CostInsight[] = []
  const costEntries: [keyof CostBreakdown, string][] = [
    ['ingredients','Ingredientes'],['energy','Energia'],['gas','Gás'],['packaging','Embalagem'],['other','Outros'],
  ]
  const nonZero = costEntries.filter(([k]) => breakdown[k] > 0)
  if (nonZero.length > 0) {
    const [topKey, topLabel] = nonZero.reduce((mx, cur) => breakdown[cur[0]] > breakdown[mx[0]] ? cur : mx)
    if (breakdownPct[topKey] > 50)
      insights.push({ type: 'info', message: `Maior custo: ${topLabel} representa ${breakdownPct[topKey].toFixed(0)}% do total` })
  }
  if (breakdownPct.packaging >= 15)
    insights.push({ type: 'warn', message: `Embalagem representa ${breakdownPct.packaging.toFixed(0)}% do custo` })
  if (input.marginPct < 20)
    insights.push({ type: 'danger', message: `Margem de ${input.marginPct}% é muito baixa` })

  return { ingredientCost, extraCost, totalBatchCost, unitCost, suggestedPrice, unitProfit, marginDecimal, status, breakdown, breakdownPct, insights }
}

export function simulateMargin(baseInput: Omit<ProductCostInput, 'marginPct'>, marginPct: number): ProductCostResult {
  return calcProductCost({ ...baseInput, marginPct })
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

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
    .map(item => ({ ...item, value: breakdown[item.key], pct: breakdownPct[item.key] }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
}
