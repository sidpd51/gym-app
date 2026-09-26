import { z } from 'zod'

export const equipmentSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),

  categoryId: z.string().min(1, 'Please select a category'),

  brand: z.string().optional(),

  model: z.string().optional(),

  serialNumber: z.string().optional(),

  purchaseDate: z
    .string()
    .optional()
    .refine((v) => {
      if (!v) return true
      const [y, m, d] = v.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      const today = new Date()
      const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      return date <= todayNorm
    }, 'Purchase date cannot be in the future'),

  purchaseCost: z
    .string()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0),
      'Enter a valid amount (0 or more)',
    )
    .optional(),

  location: z.string().optional(),

  status: z.string().min(1, 'Please select a status'),

  notes: z.string().optional(),
})

export type EquipmentFormValues = z.infer<typeof equipmentSchema>
