// ─── Tipos centralizados do GestFast ─────────────────────────────────────────

// Re-exporta types do Prisma que já existem (tabelas legado)
export type { User, Product, Ingredient, ExtraCost } from '@prisma/client'

// ─── Tipos novos (adicionados na v2) ─────────────────────────────────────────
// Definidos localmente para não quebrar build antes do db:push

export type RawMaterial = {
  id:          string
  name:        string
  category:    string | null
  unit:        string
  stockQty:    number | { toNumber(): number }
  minStockQty: number | { toNumber(): number }
  totalCost:   number | { toNumber(): number }
  totalQty:    number | { toNumber(): number }
  unitCost:    number | { toNumber(): number }
  supplier:    string | null
  expiresAt:   Date   | null
  batchNumber: string | null
  notes:       string | null
  userId:      string
  createdAt:   Date
  updatedAt:   Date
}

export type Recipe = {
  id:           string
  yieldQty:     number | { toNumber(): number }
  yieldUnit:    string
  laborMinutes: number
  packagingCost: number | { toNumber(): number }
  extraCost:    number | { toNumber(): number }
  notes:        string | null
  productId:    string
  createdAt:    Date
  updatedAt:    Date
}

export type RecipeItem = {
  id:            string
  quantity:      number | { toNumber(): number }
  unitCost:      number | { toNumber(): number }
  recipeId:      string
  rawMaterialId: string
}

export type Production = {
  id:         string
  qty:        number | { toNumber(): number }
  totalCost:  number | { toNumber(): number }
  unitCost:   number | { toNumber(): number }
  status:     string
  notes:      string | null
  producedAt: Date   | null
  productId:  string
  userId:     string
  createdAt:  Date
  updatedAt:  Date
}

export type StockMovement = {
  id:            string
  type:          string
  qty:           number | { toNumber(): number }
  unitCost:      number | { toNumber(): number }
  totalCost:     number | { toNumber(): number }
  reason:        string | null
  userId:        string
  rawMaterialId: string | null
  productId:     string | null
  createdAt:     Date
}

export type PriceHistory = {
  id:        string
  unitCost:  number | { toNumber(): number }
  salePrice: number | { toNumber(): number }
  marginPct: number | { toNumber(): number }
  productId: string
  createdAt: Date
}

export type Alert = {
  id:        string
  type:      string
  message:   string
  read:      boolean
  userId:    string
  createdAt: Date
}

// ─── UNIT helpers ─────────────────────────────────────────────────────────────

export const UNIT_LABELS: Record<string, string> = {
  g:   'Gramas (g)',
  kg:  'Quilos (kg)',
  ml:  'Mililitros (ml)',
  l:   'Litros (l)',
  un:  'Unidades',
  cx:  'Caixa',
  pct: 'Pacote',
}
