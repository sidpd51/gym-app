import { z } from 'zod'

export const recordPaymentSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  membershipId: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Amount must be greater than 0'),
  paymentMethod: z.string().min(1, 'Please select a payment method'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>
