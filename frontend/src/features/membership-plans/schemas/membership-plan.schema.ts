import { z } from 'zod'

export const membershipPlanSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),

  description: z.string(),

  durationInDays: z
    .string()
    .min(1, 'Duration is required')
    .refine((v) => {
      const n = Number(v)
      return Number.isInteger(n) && n >= 1
    }, 'Duration must be a positive whole number (e.g. 30)'),

  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => {
      const n = Number(v)
      return !isNaN(n) && n > 0
    }, 'Price must be greater than 0'),
})

export type MembershipPlanFormValues = z.infer<typeof membershipPlanSchema>
