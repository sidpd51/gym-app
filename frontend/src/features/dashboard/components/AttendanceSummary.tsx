import type { AttendanceSnapshot } from '../types/dashboard.types'
import { Activity, Clock } from 'lucide-react'

interface AttendanceSummaryProps {
  data: AttendanceSnapshot
}

export function AttendanceSummary({ data }: AttendanceSummaryProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">Today's Attendance</h3>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tight text-zinc-900">
          {data.checkedIn}
        </span>
        <span className="mb-1 text-sm text-zinc-500">members checked in</span>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2">
            <Clock size={16} className="text-purple-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Peak hour</p>
            <p className="text-sm font-medium text-zinc-900">{data.peakHour}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2">
            <Activity size={16} className="text-purple-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Currently inside</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900">
              {data.currentlyInside}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
