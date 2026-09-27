import { z } from 'zod'

export const createReminderSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  membershipId: z.string().min(1, 'Please select a membership'),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP']),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must be 500 characters or fewer'),
})

export type CreateReminderFormValues = z.infer<typeof createReminderSchema>
