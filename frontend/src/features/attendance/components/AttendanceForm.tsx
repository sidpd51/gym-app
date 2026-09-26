import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { membersMockData } from '../../members/data/members.mock'
import { membershipsMockData } from '../../memberships/data/memberships.mock'
import { attendanceMockData } from '../data/attendance.mock'
import { markAttendanceSchema, type MarkAttendanceFormValues } from '../schemas/attendance.schema'

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function getCurrentTimeString(): string {
  const d = new Date()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function inputCls(hasError: boolean) {
  return cn(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-colors',
    hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-zinc-200 focus:border-zinc-400',
  )
}

interface AttendanceFormProps {
  onSubmit: (data: MarkAttendanceFormValues) => void
  submitted: boolean
}

export function AttendanceForm({ onSubmit, submitted }: AttendanceFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MarkAttendanceFormValues>({
    resolver: zodResolver(markAttendanceSchema),
    defaultValues: {
      memberId: '',
      attendanceDate: getTodayString(),
      checkInTime: getCurrentTimeString(),
    },
  })

  const memberId = watch('memberId')
  const attendanceDate = watch('attendanceDate')

  const businessRuleError = useMemo(() => {
    if (!memberId || !attendanceDate) return null

    const hasValidMembership = membershipsMockData.some(
      (ms) =>
        ms.memberId === memberId &&
        ms.startDate <= attendanceDate &&
        ms.endDate >= attendanceDate,
    )
    if (!hasValidMembership) {
      return 'This member does not have an active membership for this date.'
    }

    const alreadyMarked = attendanceMockData.some(
      (a) => a.memberId === memberId && a.attendanceDate === attendanceDate,
    )
    if (alreadyMarked) {
      return 'Attendance has already been recorded for this member on this date.'
    }

    return null
  }, [memberId, attendanceDate])

  if (submitted) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-14 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
        <h3 className="mt-3 text-base font-semibold text-zinc-900">Attendance Marked</h3>
        <p className="mt-1 text-sm text-zinc-500">
          The member has been marked present successfully.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/attendance/new"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Mark Another
          </Link>
          <Link
            to="/attendance"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            View Attendance
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Member */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">
          Member <span className="text-red-500">*</span>
        </label>
        <select {...register('memberId')} className={inputCls(!!errors.memberId)}>
          <option value="">Select a member…</option>
          {membersMockData.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName} ({m.memberCode})
            </option>
          ))}
        </select>
        {errors.memberId && (
          <p className="text-xs text-red-500">{errors.memberId.message}</p>
        )}
      </div>

      {/* Attendance Date */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          {...register('attendanceDate')}
          className={inputCls(!!errors.attendanceDate)}
        />
        {errors.attendanceDate && (
          <p className="text-xs text-red-500">{errors.attendanceDate.message}</p>
        )}
      </div>

      {/* Check-in Time */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">
          Check-in Time <span className="text-red-500">*</span>
        </label>
        <input
          type="time"
          {...register('checkInTime')}
          className={inputCls(!!errors.checkInTime)}
        />
        {errors.checkInTime && (
          <p className="text-xs text-red-500">{errors.checkInTime.message}</p>
        )}
      </div>

      {/* Business rule warning */}
      {businessRuleError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700">{businessRuleError}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        <Link
          to="/attendance"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || !!businessRuleError}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark Present
        </button>
      </div>
    </form>
  )
}
