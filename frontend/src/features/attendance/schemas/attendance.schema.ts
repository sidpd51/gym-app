import { z } from 'zod'

export const markAttendanceSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  attendanceDate: z.string().min(1, 'Date is required'),
  checkInTime: z.string().min(1, 'Check-in time is required'),
})

export type MarkAttendanceFormValues = z.infer<typeof markAttendanceSchema>
