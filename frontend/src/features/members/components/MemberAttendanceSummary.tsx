import type { MemberAttendanceSummaryData } from '../types/member.types'

interface MemberAttendanceSummaryProps {
  data: MemberAttendanceSummaryData
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function MemberAttendanceSummary({ data }: MemberAttendanceSummaryProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <h3 className="text-sm font-semibold text-zinc-900">Attendance Summary</h3>
      <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-100">
        <div className="pr-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-zinc-900">{data.visitsThisMonth}</p>
          <p className="mt-1 text-xs text-zinc-500">Visits this month</p>
        </div>
        <div className="px-4 text-center">
          <p className="text-sm font-semibold text-zinc-900">
            {data.lastVisitDate ? formatDate(data.lastVisitDate) : '—'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Last visit</p>
        </div>
        <div className="pl-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-zinc-900">{data.averageVisitsPerWeek}</p>
          <p className="mt-1 text-xs text-zinc-500">Avg per week</p>
        </div>
      </div>
    </div>
  )
}
