import { z } from 'zod'

export const leadSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),

  phone: z
    .string()
    .min(7, 'Phone number must be at least 7 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'),

  email: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Please enter a valid email'),

  source: z.string().optional(),

  interestedPlanId: z.string().optional(),

  nextFollowUpDate: z.string().optional(),

  notes: z.string().optional(),
})

export type LeadFormValues = z.infer<typeof leadSchema>
