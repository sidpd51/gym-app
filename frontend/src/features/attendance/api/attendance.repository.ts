import type { Attendance } from '../types/attendance.types'
import { attendanceMockData } from '../data/attendance.mock'

export interface AttendanceRepository {
  list(): Attendance[]
}

export const mockAttendanceRepository: AttendanceRepository = {
  list: () => attendanceMockData,
}

export const attendanceRepository: AttendanceRepository = mockAttendanceRepository
