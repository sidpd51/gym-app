import { z } from 'zod'

export const userSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'Enter a valid email address',
    }),
  phone: z.string().refine((v) => v === '' || /^\d{10}$/.test(v), {
    message: 'Enter a valid 10-digit phone number',
  }),
  role: z.enum(['OWNER', 'ADMIN', 'RECEPTIONIST', 'TRAINER']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type UserFormValues = z.infer<typeof userSchema>

export const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  phone: z.string().refine((v) => v === '' || /^\d{10}$/.test(v), {
    message: 'Enter a valid 10-digit phone number',
  }),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
