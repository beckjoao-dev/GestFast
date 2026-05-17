/**
 * cost-calculator.ts
 * Fonte única de verdade para todos os cálculos financeiros.
 * NÃO duplicar estas fórmulas em componentes React.
 */

// ─── Conversão de unidades ────────────────────────────────────────────────────

const UNIT_FACTORS: Record<string, number> = {
  g: 1, kg: 1000, ml: 1, l: 1000, un: 1, cx: 1, pct: 1,
}

export function toBaseUnit(qty: number, fromUnit: string): number {
  return qty * (UNIT_FACTORS[fromUnit] ?? 1)
}

export function calcUnitCost(totalCost: number, totalQty: number, unit: string): number {
  if (totalQty <= 0) return 0
  const baseQty = toBaseUnit(totalQty, unit)
  return totalCost / baseQty
}

// ─── Cálculo de ficha técnica ─────────────────────────────────────────────────

export interface RecipeCostInput {
  items: Array<{
    quantity:         number
    unitCost:         number
    unit:             string
  }>
  yieldQty:         number
  laborMinutes:     number
  laborCostPerHour: number
  packagingCost:    number
  extraCost:        number
}

export interface CostBreakdownResult {
  ingredientCost:  number
  laborCost:       number
  packagingCost:   number
  extraCost:       number
  totalBatchCost:  number
  unitCost:        number
}

export function calcRecipeCost(input: RecipeCostInput): CostBreakdownResult {
  const ingredientCost = input.items.reduce((acc, item) => {
    const baseQty = toBaseUnit(item.quantity, item.unit)
    return acc + baseQty * item.unitCost
  }, 0)

  const laborCost    = (input.laborMinutes / 60) * input.laborCostPerHour
  const packagingCost = input.packagingCost
  const extraCost    = input.extraCost
  const totalBatchCost = ingredientCost + laborCost + packagingCost + extraCost
  const yieldQty     = Math.max(1, input.yieldQty)
  const unitCost     = totalBatchCost / yieldQty

  return { ingredientCost, laborCost, packagingCost, extraCost, totalBatchCost, unitCost }
}

// ─── Precificação ─────────────────────────────────────────────────────────────

export interface PricingInput {
  unitCost:    number
  marginPct:   number
  salePrice?:  number
  taxPct?:     number
  cardFeePct?: number
}

export interface PricingResult {
  unitCost:       number
  suggestedPrice: number
  salePrice:      number
  profitPerUnit:  number
  marginPct:      number
  status:         'healthy' | 'low' | 'critical' | 'loss'
}

export function calcPricing(unitCost: number, input: PricingInput): PricingResult {
  const marginDecimal  = Math.min(0.99, Math.max(0.01, input.marginPct / 100))
  const suggestedPrice = unitCost > 0 ? unitCost / (1 - marginDecimal) : 0
  const salePrice      = (input.salePrice && input.salePrice > 0) ? input.salePrice : suggestedPrice
  const profitPerUnit  = salePrice - unitCost
  const marginPct      = salePrice > 0 ? (profitPerUnit / salePrice) * 100 : 0

  const status: PricingResult['status'] =
    profitPerUnit < 0 ? 'loss'     :
    marginPct < 20    ? 'critical' :
    marginPct < 35    ? 'low'      : 'healthy'

  return { unitCost, suggestedPrice, salePrice, profitPerUnit, marginPct, status }
}

// ─── Formatadores ─────────────────────────────────────────────────────────────

export function fmtBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

export function fmtQty(n: number, unit: string): string {
  return `${n % 1 === 0 ? n : n.toFixed(2)} ${unit}`
}
