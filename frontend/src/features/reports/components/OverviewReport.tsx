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
import { useMembers } from '@/features/members/hooks/useMembers'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { useAttendance } from '@/features/attendance/hooks/useAttendance'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { useExpenses } from '@/features/expenses/hooks/useExpenses'
import type { DateRange } from '../types/reports.types'
import { inRange, fmtCurrency, fmtShort } from '../utils/report-filters'
import { ReportStatCard } from './ReportStatCard'

interface Props {
  range: DateRange
}

export function OverviewReport({ range }: Props) {
  const { members } = useMembers()
  const { payments } = usePayments()
  const { attendance } = useAttendance()
  const { leads } = useLeads()
  const { expenses: expensesData } = useExpenses()

  const filteredPayments = useMemo(
    () => payments.filter((p) => p.status === 'COMPLETED' && inRange(p.paymentDate, range)),
    [payments, range]
  )

  const filteredExpenses = useMemo(
    () => expensesData.filter((e) => inRange(e.expenseDate, range)),
    [expensesData, range]
  )

  const revenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
  const expenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const netCashFlow = revenue - expenses

  const activeMembers = members.filter((m) => m.status === 'ACTIVE').length

  const newMembers = useMemo(
    () => members.filter((m) => inRange(m.joiningDate, range)).length,
    [members, range]
  )

  const attendanceCount = useMemo(
    () => attendance.filter((a) => inRange(a.attendanceDate, range)).length,
    [attendance, range]
  )

  const newLeads = useMemo(
    () => leads.filter((l) => inRange(l.createdAt, range)).length,
    [leads, range]
  )

  const chartData = useMemo(() => {
    const months = new Map<string, { month: string; revenue: number; expenses: number }>()

    filteredPayments.forEach((p) => {
      const key = p.paymentDate.slice(0, 7)
      if (!months.has(key)) {
        const [y, m] = key.split('-').map(Number)
        months.set(key, {
          month: new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          revenue: 0,
          expenses: 0,
        })
      }
      months.get(key)!.revenue += p.amount
    })

    filteredExpenses.forEach((e) => {
      const key = e.expenseDate.slice(0, 7)
      if (!months.has(key)) {
        const [y, m] = key.split('-').map(Number)
        months.set(key, {
          month: new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          revenue: 0,
          expenses: 0,
        })
      }
      months.get(key)!.expenses += e.amount
    })

    return Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data)
  }, [filteredPayments, filteredExpenses])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportStatCard
          label="Revenue"
          value={fmtCurrency(revenue)}
          subtext={`${filteredPayments.length} payment${filteredPayments.length !== 1 ? 's' : ''}`}
          highlight="positive"
        />
        <ReportStatCard
          label="Expenses"
          value={fmtCurrency(expenses)}
          subtext={`${filteredExpenses.length} entr${filteredExpenses.length !== 1 ? 'ies' : 'y'}`}
          highlight="negative"
        />
        <ReportStatCard
          label="Net Cash Flow"
          value={fmtCurrency(netCashFlow)}
          highlight={netCashFlow >= 0 ? 'positive' : 'negative'}
        />
        <ReportStatCard label="Active Members" value={activeMembers} subtext="current" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ReportStatCard label="New Members" value={newMembers} subtext="in period" />
        <ReportStatCard label="Check-ins" value={attendanceCount} subtext="in period" />
        <ReportStatCard label="New Leads" value={newLeads} subtext="in period" />
      </div>

      {chartData.length > 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Revenue vs Expenses</h2>
          <figure className="mt-4" aria-label="Revenue vs expenses chart">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => fmtShort(v)}
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(value, name) =>
                    [
                      typeof value === 'number' ? fmtCurrency(value) : String(value),
                      name === 'revenue' ? 'Revenue' : 'Expenses',
                    ] as [string, string]
                  }
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid #e4e4e7',
                    fontSize: '12px',
                    boxShadow: 'none',
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} name="revenue" />
                <Bar dataKey="expenses" fill="#f97316" radius={[3, 3, 0, 0]} name="expenses" />
              </BarChart>
            </ResponsiveContainer>
          </figure>
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-500" /> Expenses
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10 text-center">
          <p className="text-sm text-zinc-400">No financial data available for this period.</p>
        </div>
      )}
    </div>
  )
}
