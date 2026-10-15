import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type { Attendance } from '../types/attendance.types'
import { attendanceMockData } from '../data/attendance.mock'

// Backend attendance Response (internal/modules/attendance/attendance.go).
export interface BackendAttendance {
  id: string
  memberId: string
  membershipId: string | null
  attendanceDate: string
  checkInTime: string
  status: string
  createdAt: string
}

export function mapBackendAttendance(payload: BackendAttendance): Attendance {
  return {
    id: payload.id,
    memberId: payload.memberId,
    membershipId: payload.membershipId ?? undefined,
    attendanceDate: payload.attendanceDate,
    checkInTime: payload.checkInTime,
    status: payload.status as Attendance['status'],
  }
}

export interface AttendanceListQuery extends ListQueryParams {
  memberId?: string
  fromDate?: string
  toDate?: string
}

export interface AttendanceRepository {
  list(query?: AttendanceListQuery, signal?: AbortSignal): Promise<PaginatedResponse<Attendance>>
  mark(memberId: string): Promise<Attendance>
}

function toQuery(query?: AttendanceListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    memberId: query?.memberId,
    fromDate: query?.fromDate,
    toDate: query?.toDate,
  }
}

export const apiAttendanceRepository: AttendanceRepository = {
  async list(query?: AttendanceListQuery, signal?: AbortSignal): Promise<PaginatedResponse<Attendance>> {
    const res = await apiClient.get<PaginatedResponse<BackendAttendance>>(
      '/api/v1/attendance',
      toQuery(query),
      { signal },
    )
    return {
      meta: res.meta,
      data: res.data.map(mapBackendAttendance),
    }
  },

  // Backend derives attendanceDate (today IST) and checkInTime (now)
  // server-side; only memberId is sent. Business rules (duplicate 409,
  // no active membership 422) surface as ApiError.
  async mark(memberId: string): Promise<Attendance> {
    const res = await apiClient.post<BackendAttendance>('/api/v1/attendance', { memberId })
    return mapBackendAttendance(res)
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockAttendanceRepository = {
  list: (): Attendance[] => attendanceMockData,
}

export const attendanceRepository: AttendanceRepository = apiAttendanceRepository
