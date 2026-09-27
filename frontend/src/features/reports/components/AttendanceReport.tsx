import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAttendance } from '@/features/attendance/hooks/useAttendance'
import { useMembers } from '@/features/members/hooks/useMembers'
import type { DateRange } from '../types/reports.types'
import { inRange, formatDisplayDate } from '../utils/report-filters'
import { ReportStatCard } from './ReportStatCard'

interface Props {
  range: DateRange
}

export function AttendanceReport({ range }: Props) {
  const { attendance } = useAttendance()
  const { members } = useMembers()

  const filtered = useMemo(
    () => attendance.filter((a) => inRange(a.attendanceDate, range)),
    [attendance, range]
  )

  const uniqueMembers = useMemo(
    () => new Set(filtered.map((a) => a.memberId)).size,
    [filtered]
  )

  const dailyCounts = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((a) => {
      map.set(a.attendanceDate, (map.get(a.attendanceDate) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => {
        const [y, m, d] = date.split('-').map(Number)
        return {
          date: new Date(y, m - 1, d).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          }),
          count,
          rawDate: date,
        }
      })
  }, [filtered])

  const busiestDay =
    dailyCounts.length > 0
      ? dailyCounts.reduce((max, cur) => (cur.count > max.count ? cur : max))
      : null

  const memberMap = useMemo(() => {
    const map = new Map<string, string>()
    members.forEach((m) => map.set(m.id, `${m.firstName} ${m.lastName}`))
    return map
  }, [members])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <ReportStatCard label="Total Check-ins" value={filtered.length} />
        <ReportStatCard label="Unique Members" value={uniqueMembers} />
        <ReportStatCard
          label="Busiest Day"
          value={busiestDay ? `${busiestDay.count} check-ins` : '—'}
          subtext={busiestDay ? formatDisplayDate(busiestDay.rawDate) : undefined}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900">Check-ins by Day</h2>
        {dailyCounts.length > 0 ? (
          <figure className="mt-4" aria-label="Daily check-in chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyCounts} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [value, 'Check-ins'] as [number, string]}
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid #e4e4e7',
                    fontSize: '12px',
                    boxShadow: 'none',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </figure>
        ) : (
          <p className="mt-10 text-center text-sm text-zinc-400">
            No attendance data for this period.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900">
          Attendance Records
          <span className="ml-2 text-xs font-normal text-zinc-400">({filtered.length})</span>
        </h2>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">No attendance records for this period.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Member</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Date</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice()
                  .sort((a, b) =>
                    a.attendanceDate !== b.attendanceDate
                      ? a.attendanceDate < b.attendanceDate
                        ? 1
                        : -1
                      : a.checkInTime.localeCompare(b.checkInTime)
                  )
                  .map((a) => (
                    <tr key={a.id} className="border-b border-zinc-50">
                      <td className="py-2 font-medium text-zinc-900">
                        {memberMap.get(a.memberId) ?? a.memberId}
                      </td>
                      <td className="py-2 text-zinc-500">{formatDisplayDate(a.attendanceDate)}</td>
                      <td className="py-2 text-zinc-500">{a.checkInTime}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
