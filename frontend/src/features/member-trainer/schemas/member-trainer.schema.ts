import { z } from 'zod'

export const assignTrainerSchema = z.object({
  trainerId: z.string().min(1, 'Please select a trainer'),
  startDate: z.string().min(1, 'Start date is required'),
})

export type AssignTrainerFormValues = z.infer<typeof assignTrainerSchema>
