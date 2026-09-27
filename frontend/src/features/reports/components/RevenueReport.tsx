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
import { usePayments } from '@/features/payments/hooks/usePayments'
import { useMembers } from '@/features/members/hooks/useMembers'
import { PAYMENT_METHOD_LABELS } from '@/features/payments/types/payment.types'
import type { PaymentMethod } from '@/features/payments/types/payment.types'
import type { DateRange } from '../types/reports.types'
import { inRange, formatDisplayDate, fmtCurrency, fmtShort } from '../utils/report-filters'
import { ReportStatCard } from './ReportStatCard'

interface Props {
  range: DateRange
}

export function RevenueReport({ range }: Props) {
  const { payments } = usePayments()
  const { members } = useMembers()

  const filteredCompleted = useMemo(
    () => payments.filter((p) => p.status === 'COMPLETED' && inRange(p.paymentDate, range)),
    [payments, range]
  )

  const allInRange = useMemo(
    () => payments.filter((p) => inRange(p.paymentDate, range)),
    [payments, range]
  )

  const totalRevenue = filteredCompleted.reduce((sum, p) => sum + p.amount, 0)
  const avgPayment = filteredCompleted.length > 0 ? totalRevenue / filteredCompleted.length : 0

  const pendingCount = allInRange.filter((p) => p.status === 'PENDING').length
  const pendingAmount = allInRange
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0)

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>()
    filteredCompleted.forEach((p) => {
      const key = p.paymentDate.slice(0, 7)
      map.set(key, (map.get(key) ?? 0) + p.amount)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, amount]) => {
        const [y, m] = key.split('-').map(Number)
        return {
          month: new Date(y, m - 1, 1).toLocaleDateString('en-IN', {
            month: 'short',
            year: '2-digit',
          }),
          amount,
        }
      })
  }, [filteredCompleted])

  const byMethod = useMemo(() => {
    const map = new Map<string, number>()
    filteredCompleted.forEach((p) => {
      map.set(p.paymentMethod, (map.get(p.paymentMethod) ?? 0) + p.amount)
    })
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([method, amount]) => ({
        method: PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method,
        amount,
      }))
  }, [filteredCompleted])

  const memberMap = useMemo(() => {
    const map = new Map<string, string>()
    members.forEach((m) => map.set(m.id, `${m.firstName} ${m.lastName}`))
    return map
  }, [members])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <ReportStatCard
          label="Total Revenue"
          value={fmtCurrency(totalRevenue)}
          subtext={`${filteredCompleted.length} completed payment${filteredCompleted.length !== 1 ? 's' : ''}`}
          highlight="positive"
        />
        <ReportStatCard
          label="Avg per Payment"
          value={filteredCompleted.length > 0 ? fmtCurrency(Math.round(avgPayment)) : '—'}
        />
        <ReportStatCard
          label="Pending"
          value={fmtCurrency(pendingAmount)}
          subtext={`${pendingCount} pending payment${pendingCount !== 1 ? 's' : ''}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Revenue by Month</h2>
          {revenueByMonth.length > 0 ? (
            <figure className="mt-4" aria-label="Revenue by month chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueByMonth} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
                    formatter={(value) =>
                      [
                        typeof value === 'number' ? fmtCurrency(value) : String(value),
                        'Revenue',
                      ] as [string, string]
                    }
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #e4e4e7',
                      fontSize: '12px',
                      boxShadow: 'none',
                    }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </figure>
          ) : (
            <p className="mt-10 text-center text-sm text-zinc-400">No revenue data for this period.</p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">By Payment Method</h2>
          {byMethod.length > 0 ? (
            <figure className="mt-4" aria-label="Revenue by payment method chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={byMethod}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => fmtShort(v)}
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="method"
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(value) =>
                      [
                        typeof value === 'number' ? fmtCurrency(value) : String(value),
                        'Amount',
                      ] as [string, string]
                    }
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #e4e4e7',
                      fontSize: '12px',
                      boxShadow: 'none',
                    }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[0, 3, 3, 0]} />
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
          Payments
          <span className="ml-2 text-xs font-normal text-zinc-400">({allInRange.length} in period)</span>
        </h2>
        {allInRange.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">No payments found for this period.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">ID</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Member</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Date</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Method</th>
                  <th className="pb-2 text-right text-xs font-medium text-zinc-400">Amount</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {allInRange
                  .slice()
                  .sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1))
                  .map((p) => (
                    <tr key={p.id} className="border-b border-zinc-50">
                      <td className="py-2 font-mono text-xs text-zinc-500">{p.id}</td>
                      <td className="py-2 text-zinc-900">{memberMap.get(p.memberId) ?? p.memberId}</td>
                      <td className="py-2 text-zinc-500">{formatDisplayDate(p.paymentDate)}</td>
                      <td className="py-2 text-zinc-500">{PAYMENT_METHOD_LABELS[p.paymentMethod]}</td>
                      <td className="py-2 text-right font-medium text-zinc-900">
                        {fmtCurrency(p.amount)}
                      </td>
                      <td className="py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {p.status}
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
