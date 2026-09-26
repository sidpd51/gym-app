export type AttendanceStatus = 'PRESENT'

export interface Attendance {
  id: string
  memberId: string
  membershipId?: string
  attendanceDate: string
  checkInTime: string
  status: AttendanceStatus
}
