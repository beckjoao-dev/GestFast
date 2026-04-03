import { z } from 'zod'

export const LoginSchema = z.object({
  email:    z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(1, 'Informe a senha'),
})

export const RegisterSchema = z.object({
  name:     z.string().min(2, 'Nome muito curto').max(80),
  email:    z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres').max(100),
})

export const IngredientSchema = z.object({
  name:      z.string().min(1, 'Informe o nome').max(100),
  unit:      z.enum(['g', 'kg', 'ml', 'l', 'un']),
  totalCost: z.number().positive('Custo deve ser positivo'),
  totalQty:  z.number().positive('Quantidade deve ser positiva'),
})

export const ProductIngredientSchema = z.object({
  ingredientId: z.string().min(1),
  quantity:     z.number().positive('Quantidade deve ser positiva'),
})

export const ProductExtraCostSchema = z.object({
  extraCostId: z.string().min(1),
  quantity:    z.number().positive('Quantidade deve ser positiva'),
})

export const ProductSchema = z.object({
  name:        z.string().min(1, 'Informe o nome').max(100),
  timeMinutes: z.number().int().min(0).nullable().optional(),
  marginPct:   z.number().min(1, 'Margem mínima 1%').max(99, 'Margem máxima 99%'),
  batchSize:   z.number().int().min(1).default(1),
  salePrice:   z.number().min(0).default(0),
  energyCost:  z.number().min(0).default(0),
  gasCost:     z.number().min(0).default(0),
  packCost:    z.number().min(0).default(0),
  otherCost:   z.number().min(0).default(0),
  ingredients: z.array(ProductIngredientSchema).default([]),
  extraCosts:  z.array(ProductExtraCostSchema).default([]),
})

export type LoginInput      = z.infer<typeof LoginSchema>
export type IngredientInput = z.infer<typeof IngredientSchema>
export type ProductInput    = z.infer<typeof ProductSchema>
