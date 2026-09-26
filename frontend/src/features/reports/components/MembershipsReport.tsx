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
import { membershipsMockData } from '@/features/memberships/data/memberships.mock'
import type { DateRange } from '../types/reports.types'
import { inRange, formatDisplayDate, fmtCurrency } from '../utils/report-filters'
import { ReportStatCard } from './ReportStatCard'

interface Props {
  range: DateRange
}

export function MembershipsReport({ range }: Props) {
  const active = membershipsMockData.filter((m) => m.status === 'ACTIVE').length
  const expired = membershipsMockData.filter((m) => m.status === 'EXPIRED').length
  const cancelled = membershipsMockData.filter((m) => m.status === 'CANCELLED').length

  const newInPeriod = useMemo(
    () => membershipsMockData.filter((m) => inRange(m.startDate, range)),
    [range]
  )

  const revenueInPeriod = newInPeriod.reduce((sum, m) => sum + m.amount, 0)

  const planData = useMemo(() => {
    const map = new Map<string, number>()
    membershipsMockData.forEach((m) => {
      map.set(m.planName, (map.get(m.planName) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([plan, count]) => ({ plan, count }))
  }, [])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportStatCard label="Active" value={active} highlight="positive" />
        <ReportStatCard label="Expired" value={expired} />
        <ReportStatCard label="Cancelled" value={cancelled} />
        <ReportStatCard
          label="New in Period"
          value={newInPeriod.length}
          subtext={newInPeriod.length > 0 ? fmtCurrency(revenueInPeriod) : undefined}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900">Memberships by Plan</h2>
        <p className="mt-0.5 text-xs text-zinc-500">All memberships</p>
        <figure className="mt-4" aria-label="Memberships by plan chart">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={planData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="plan"
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
                formatter={(value) => [value, 'Memberships'] as [number, string]}
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

      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900">
          New Memberships in Period
          <span className="ml-2 text-xs font-normal text-zinc-400">({newInPeriod.length})</span>
        </h2>
        {newInPeriod.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">No new memberships started during this period.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">ID</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Plan</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Start Date</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">End Date</th>
                  <th className="pb-2 text-right text-xs font-medium text-zinc-400">Amount</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {newInPeriod.map((ms) => (
                  <tr key={ms.id} className="border-b border-zinc-50">
                    <td className="py-2 font-mono text-xs text-zinc-500">{ms.id}</td>
                    <td className="py-2 font-medium text-zinc-900">{ms.planName}</td>
                    <td className="py-2 text-zinc-500">{formatDisplayDate(ms.startDate)}</td>
                    <td className="py-2 text-zinc-500">{formatDisplayDate(ms.endDate)}</td>
                    <td className="py-2 text-right font-medium text-zinc-900">
                      {fmtCurrency(ms.amount)}
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          ms.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : ms.status === 'EXPIRED'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {ms.status}
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
