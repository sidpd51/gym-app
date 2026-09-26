import { z } from 'zod'

export const createMemberSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),

  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),

  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),

  email: z.string().refine(
    (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: 'Enter a valid email address' }
  ),

  dateOfBirth: z.string().refine(
    (v) => {
      if (v === '') return true
      const d = new Date(v)
      return !isNaN(d.getTime()) && d <= new Date()
    },
    { message: 'Date of birth cannot be in the future' }
  ),

  gender: z.string(),

  address: z.string(),

  emergencyContactName: z.string(),
  emergencyContactPhone: z.string(),
  emergencyContactRelationship: z.string(),

  joiningDate: z.string().min(1, 'Joining date is required'),
})

export type MemberFormValues = z.infer<typeof createMemberSchema>
