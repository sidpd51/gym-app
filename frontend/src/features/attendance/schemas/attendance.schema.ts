import { z } from 'zod'

// Backend POST /api/v1/attendance accepts only memberId; attendanceDate
// (today IST) and checkInTime are set server-side.
export const markAttendanceSchema = z.object({
  memberId: z.string().min(1, 'Please select a member'),
  // Kept in the form values for UI display only (not sent to backend).
  attendanceDate: z.string().optional(),
  checkInTime: z.string().optional(),
})

export type MarkAttendanceFormValues = z.infer<typeof markAttendanceSchema>
