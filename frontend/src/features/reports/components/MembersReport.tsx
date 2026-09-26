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
import { membersMockData } from '@/features/members/data/members.mock'
import type { DateRange } from '../types/reports.types'
import { inRange, formatDisplayDate } from '../utils/report-filters'
import { ReportStatCard } from './ReportStatCard'

interface Props {
  range: DateRange
}

export function MembersReport({ range }: Props) {
  const total = membersMockData.length
  const active = membersMockData.filter((m) => m.status === 'ACTIVE').length
  const expired = membersMockData.filter((m) => m.status === 'EXPIRED').length
  const suspended = membersMockData.filter((m) => m.status === 'SUSPENDED').length
  const cancelled = membersMockData.filter((m) => m.status === 'CANCELLED').length

  const newInPeriod = useMemo(
    () => membersMockData.filter((m) => inRange(m.joiningDate, range)),
    [range]
  )

  const statusData = [
    { status: 'Active', count: active },
    { status: 'Expired', count: expired },
    { status: 'Suspended', count: suspended },
    { status: 'Cancelled', count: cancelled },
  ]

  // Members who joined in 2026, grouped by month — context chart, not range-filtered
  const joinByMonth = useMemo(() => {
    const map = new Map<string, number>()
    membersMockData.forEach((m) => {
      if (!m.joiningDate.startsWith('2026')) return
      const key = m.joiningDate.slice(0, 7)
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => {
        const [y, mo] = key.split('-').map(Number)
        return {
          month: new Date(y, mo - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          count,
        }
      })
  }, [])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportStatCard label="Total Members" value={total} />
        <ReportStatCard label="Active" value={active} highlight="positive" />
        <ReportStatCard label="Expired" value={expired} />
        <ReportStatCard label="Suspended / Cancelled" value={suspended + cancelled} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Status Distribution</h2>
          <figure className="mt-4" aria-label="Member status distribution chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={statusData}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  formatter={(value) => [value, 'Members'] as [number, string]}
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid #e4e4e7',
                    fontSize: '12px',
                    boxShadow: 'none',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </figure>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">New Members by Month</h2>
          <p className="mt-0.5 text-xs text-zinc-500">2026 context</p>
          <figure className="mt-4" aria-label="New members by month chart">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={joinByMonth} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="month"
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
                  formatter={(value) => [value, 'New Members'] as [number, string]}
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid #e4e4e7',
                    fontSize: '12px',
                    boxShadow: 'none',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </figure>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900">
          New Members in Period
          <span className="ml-2 text-xs font-normal text-zinc-400">({newInPeriod.length})</span>
        </h2>
        {newInPeriod.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">No new members joined during this period.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Code</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Name</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Joined</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Plan</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {newInPeriod.map((m) => (
                  <tr key={m.id} className="border-b border-zinc-50">
                    <td className="py-2 font-mono text-xs text-zinc-500">{m.memberCode}</td>
                    <td className="py-2 font-medium text-zinc-900">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="py-2 text-zinc-500">{formatDisplayDate(m.joiningDate)}</td>
                    <td className="py-2 text-zinc-500">{m.membershipPlan ?? '—'}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
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
