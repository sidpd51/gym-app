import { z } from 'zod'

export const inventoryItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),

  categoryId: z.string().min(1, 'Please select a category'),

  unit: z
    .string()
    .min(1, 'Unit is required')
    .max(20, 'Unit must be at most 20 characters'),

  currentStock: z.string().optional(),

  minimumStock: z
    .string()
    .refine(
      (v) => v.length > 0 && !isNaN(Number(v)) && Number(v) >= 0,
      'Enter a valid quantity (0 or more)',
    ),

  description: z.string().optional(),
})

export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>
