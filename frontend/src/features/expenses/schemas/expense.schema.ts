import { z } from 'zod'

export const expenseSchema = z.object({
  categoryId: z.string().min(1, 'Please select a category'),

  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must be at most 200 characters'),

  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Amount must be greater than 0'),

  expenseDate: z.string().min(1, 'Date is required'),

  paymentMethod: z.string().min(1, 'Please select a payment method'),

  vendor: z.string().optional(),

  notes: z.string().optional(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
