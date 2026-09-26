import { z } from 'zod'

export const gymProfileSchema = z.object({
  gymName: z
    .string()
    .min(1, 'Gym name is required')
    .max(100, 'Gym name must be at most 100 characters')
    .refine((v) => v.trim().length >= 2, 'Gym name must be at least 2 characters'),
  phone: z
    .string()
    .refine(
      (v) => v.trim() === '' || /^[+]?[\d\s\-()]{7,20}$/.test(v.trim()),
      'Enter a valid phone number'
    ),
  email: z
    .string()
    .refine(
      (v) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      'Enter a valid email address'
    ),
  address: z.string().max(300, 'Address must be at most 300 characters'),
})

export type GymProfileFormValues = z.infer<typeof gymProfileSchema>

export const membershipSettingsSchema = z.object({
  membershipGracePeriodDays: z
    .string()
    .min(1, 'Grace period is required')
    .refine(
      (v) => /^\d+$/.test(v.trim()) && parseInt(v.trim(), 10) >= 0,
      'Must be a whole number 0 or greater'
    ),
})

export type MembershipSettingsFormValues = z.infer<typeof membershipSettingsSchema>

export const attendanceSettingsSchema = z
  .object({
    attendanceStartTime: z.string(),
    attendanceEndTime: z.string(),
    allowAttendanceForExpiredMembership: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.attendanceStartTime && data.attendanceEndTime) {
      if (data.attendanceStartTime >= data.attendanceEndTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['attendanceEndTime'],
          message: 'End time must be after start time',
        })
      }
    }
  })

export type AttendanceSettingsFormValues = z.infer<typeof attendanceSettingsSchema>

export const preferencesSchema = z.object({
  dateFormat: z.string().min(1, 'Please select a date format'),
})

export type PreferencesFormValues = z.infer<typeof preferencesSchema>
