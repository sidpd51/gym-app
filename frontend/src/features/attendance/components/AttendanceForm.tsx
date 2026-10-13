import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FormSelect } from '@/components/common/FormSelect'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useMembers } from '../../members/hooks/useMembers'
import { useMarkAttendance } from '../hooks/useAttendance'
import { markAttendanceSchema, type MarkAttendanceFormValues } from '../schemas/attendance.schema'

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

/**
 * Backend POST /api/v1/attendance accepts only memberId; the server
 * stamps attendanceDate (today, Asia/Kolkata) and checkInTime itself.
 * The date/time inputs from the old mock form are therefore not sent.
 */
export function AttendanceForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { members, isLoading: membersLoading } = useMembers()
  const { mark, isMarking, error, reset } = useMarkAttendance(onSuccess)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MarkAttendanceFormValues>({
    resolver: zodResolver(markAttendanceSchema),
    defaultValues: {
      memberId: '',
      attendanceDate: getTodayString(),
      checkInTime: '',
    },
  })

  async function onSubmit(data: MarkAttendanceFormValues) {
    try {
      await mark(data.memberId)
      setSuccess(true)
    } catch {
      // error state handled by useMarkAttendance
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-14 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
        <h3 className="mt-3 text-base font-semibold text-zinc-900">Attendance Marked</h3>
        <p className="mt-1 text-sm text-zinc-500">
          The member has been marked present for today.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              reset()
              setSuccess(false)
            }}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Mark Another
          </button>
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
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error.message}
        </div>
      )}

      {/* Member */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">
          Member <span className="text-red-500">*</span>
        </label>
        <FormSelect
          error={!!errors.memberId}
          disabled={membersLoading}
          {...register('memberId')}
        >
          <option value="">
            {membersLoading ? 'Loading members…' : 'Select a member'}
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName} ({m.memberCode})
            </option>
          ))}
        </FormSelect>
        {errors.memberId && (
          <p className="text-xs text-red-500">{errors.memberId.message}</p>
        )}
        <p className="text-xs text-zinc-500">
          Attendance will be marked for today (IST). Duplicate check-ins and
          membership policy are enforced by the server.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isMarking}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMarking ? 'Marking…' : 'Mark Present'}
        </button>
      </div>
    </form>
  )
}
