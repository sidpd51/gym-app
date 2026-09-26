import { z } from 'zod'

export const createMembershipSchema = z.object({
  planId: z.string().min(1, 'Please select a plan'),
  startDate: z.string().min(1, 'Start date is required'),
})

export type CreateMembershipFormValues = z.infer<typeof createMembershipSchema>
