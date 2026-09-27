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
import { useLeads } from '@/features/leads/hooks/useLeads'
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/features/leads/types/lead.types'
import type { LeadStatus, LeadSource } from '@/features/leads/types/lead.types'
import type { DateRange } from '../types/reports.types'
import { inRange, formatDisplayDate } from '../utils/report-filters'
import { ReportStatCard } from './ReportStatCard'

interface Props {
  range: DateRange
}

const STATUS_ORDER: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'FOLLOW_UP',
  'CONVERTED',
  'LOST',
]

export function LeadsReport({ range }: Props) {
  const { leads } = useLeads()

  const filtered = useMemo(
    () => leads.filter((l) => inRange(l.createdAt, range)),
    [leads, range]
  )

  const converted = filtered.filter((l) => l.status === 'CONVERTED').length
  const lost = filtered.filter((l) => l.status === 'LOST').length
  const conversionRate =
    filtered.length > 0 ? Math.round((converted / filtered.length) * 100) : 0

  const byStatus = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status: LEAD_STATUS_LABELS[status],
        count: filtered.filter((l) => l.status === status).length,
      })).filter((d) => d.count > 0),
    [filtered]
  )

  const bySource = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((l) => {
      if (l.source) map.set(l.source, (map.get(l.source) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => ({
        source: LEAD_SOURCE_LABELS[source as LeadSource] ?? source,
        count,
      }))
  }, [filtered])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportStatCard label="Total Leads" value={filtered.length} subtext="in period" />
        <ReportStatCard label="Converted" value={converted} highlight="positive" />
        <ReportStatCard label="Lost" value={lost} highlight="negative" />
        <ReportStatCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          highlight={conversionRate > 0 ? 'positive' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">By Status</h2>
          {byStatus.length > 0 ? (
            <figure className="mt-4" aria-label="Leads by status chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byStatus} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis
                    dataKey="status"
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
                    formatter={(value) => [value, 'Leads'] as [number, string]}
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #e4e4e7',
                      fontSize: '12px',
                      boxShadow: 'none',
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </figure>
          ) : (
            <p className="mt-10 text-center text-sm text-zinc-400">No leads for this period.</p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">By Source</h2>
          {bySource.length > 0 ? (
            <figure className="mt-4" aria-label="Leads by source chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bySource} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis
                    dataKey="source"
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
                    formatter={(value) => [value, 'Leads'] as [number, string]}
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #e4e4e7',
                      fontSize: '12px',
                      boxShadow: 'none',
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </figure>
          ) : (
            <p className="mt-10 text-center text-sm text-zinc-400">No data for this period.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900">
          Lead Records
          <span className="ml-2 text-xs font-normal text-zinc-400">({filtered.length})</span>
        </h2>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">No leads found for this period.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Code</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Name</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Source</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Created</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice()
                  .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                  .map((l) => (
                    <tr key={l.id} className="border-b border-zinc-50">
                      <td className="py-2 font-mono text-xs text-zinc-500">{l.leadCode}</td>
                      <td className="py-2 font-medium text-zinc-900">{l.name}</td>
                      <td className="py-2 text-zinc-500">
                        {l.source ? (LEAD_SOURCE_LABELS[l.source] ?? l.source) : '—'}
                      </td>
                      <td className="py-2 text-zinc-500">{formatDisplayDate(l.createdAt)}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            l.status === 'CONVERTED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : l.status === 'LOST'
                                ? 'bg-red-50 text-red-700'
                                : l.status === 'NEW'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {LEAD_STATUS_LABELS[l.status]}
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
