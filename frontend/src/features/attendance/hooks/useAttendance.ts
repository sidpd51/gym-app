import { attendanceRepository } from '../api/attendance.repository'
import type { Attendance } from '../types/attendance.types'

export function useAttendance(): { attendance: Attendance[] } {
  return { attendance: attendanceRepository.list() }
}
