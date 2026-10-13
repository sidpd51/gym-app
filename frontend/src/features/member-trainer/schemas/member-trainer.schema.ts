import { z } from 'zod'

// Backend POST /api/v1/members/{memberId}/trainer accepts only trainerId;
// startDate is set server-side (today).
export const assignTrainerSchema = z.object({
  trainerId: z.string().min(1, 'Please select a trainer'),
  // Kept for form display only (not sent to backend).
  startDate: z.string().optional(),
})

export type AssignTrainerFormValues = z.infer<typeof assignTrainerSchema>
