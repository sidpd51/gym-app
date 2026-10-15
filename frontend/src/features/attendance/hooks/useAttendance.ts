import { useCallback, useState } from 'react'
import { useApiList } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import { attendanceRepository, type AttendanceListQuery } from '../api/attendance.repository'
import type { Attendance } from '../types/attendance.types'

interface AttendanceResult {
  attendance: Attendance[]
  meta: PaginatedResponse<Attendance>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async attendance list backed by GET /api/v1/attendance.
 * `attendance` defaults to [] while loading so existing cross-feature
 * consumers (reports, dashboards) keep working during fetch.
 */
export function useAttendance(query?: AttendanceListQuery): AttendanceResult {
  const normalized: AttendanceListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<Attendance>(normalized, (q, signal) =>
    attendanceRepository.list(q as AttendanceListQuery, signal),
  )
  return { attendance: data ?? [], meta, isLoading, error, refetch }
}

interface MarkAttendanceResult {
  mark: (memberId: string) => Promise<Attendance>
  isMarking: boolean
  error: ApiError | null
  reset: () => void
}

/** Wraps POST /api/v1/attendance (server sets date/time in IST). */
export function useMarkAttendance(onSuccess?: () => void): MarkAttendanceResult {
  const [isMarking, setIsMarking] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const mark = useCallback(
    async (memberId: string) => {
      setIsMarking(true)
      setError(null)
      try {
        const result = await attendanceRepository.mark(memberId)
        onSuccess?.()
        return result
      } catch (err) {
        setError(err instanceof Error ? (err as unknown as ApiError) : null)
        throw err
      } finally {
        setIsMarking(false)
      }
    },
    [onSuccess],
  )

  const reset = useCallback(() => setError(null), [])

  return { mark, isMarking, error, reset }
}
