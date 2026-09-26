import { z } from 'zod'

export const trainerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be at most 50 characters'),

  phone: z
    .string()
    .min(7, 'Phone number must be at least 7 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'),

  email: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Please enter a valid email'),

  specialization: z.string().optional(),

  joiningDate: z.string().min(1, 'Joining date is required'),
})

export type TrainerFormValues = z.infer<typeof trainerSchema>
