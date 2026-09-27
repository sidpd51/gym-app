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
import { useExpenses, useExpenseCategories } from '@/features/expenses/hooks/useExpenses'
import { EXPENSE_PAYMENT_METHOD_LABELS } from '@/features/expenses/types/expense.types'
import type { ExpensePaymentMethod } from '@/features/expenses/types/expense.types'
import type { DateRange } from '../types/reports.types'
import { inRange, formatDisplayDate, fmtCurrency, fmtShort } from '../utils/report-filters'
import { ReportStatCard } from './ReportStatCard'

interface Props {
  range: DateRange
}

export function ExpensesReport({ range }: Props) {
  const { expenses } = useExpenses()
  const { categories: expenseCategories } = useExpenseCategories()

  const filtered = useMemo(
    () => expenses.filter((e) => inRange(e.expenseDate, range)),
    [expenses, range]
  )

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)
  const avg = filtered.length > 0 ? total / filtered.length : 0

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((e) => {
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount)
    })
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([catId, amount]) => ({
        category: expenseCategories.find((c) => c.id === catId)?.name ?? catId,
        amount,
      }))
  }, [filtered, expenseCategories])

  const byMethod = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((e) => {
      map.set(e.paymentMethod, (map.get(e.paymentMethod) ?? 0) + e.amount)
    })
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([method, amount]) => ({
        method: EXPENSE_PAYMENT_METHOD_LABELS[method as ExpensePaymentMethod] ?? method,
        amount,
      }))
  }, [filtered])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <ReportStatCard
          label="Total Expenses"
          value={fmtCurrency(total)}
          subtext={`${filtered.length} entr${filtered.length !== 1 ? 'ies' : 'y'}`}
          highlight="negative"
        />
        <ReportStatCard
          label="Avg per Expense"
          value={filtered.length > 0 ? fmtCurrency(Math.round(avg)) : '—'}
        />
        <ReportStatCard
          label="Top Category"
          value={byCategory[0]?.category ?? '—'}
          subtext={byCategory[0] ? fmtCurrency(byCategory[0].amount) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">By Category</h2>
          {byCategory.length > 0 ? (
            <figure className="mt-4" aria-label="Expenses by category chart">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={byCategory}
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
                    dataKey="category"
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
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
                  <Bar dataKey="amount" fill="#f97316" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </figure>
          ) : (
            <p className="mt-10 text-center text-sm text-zinc-400">No data for this period.</p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">By Payment Method</h2>
          {byMethod.length > 0 ? (
            <figure className="mt-4" aria-label="Expenses by payment method chart">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byMethod} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis
                    dataKey="method"
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
                  <Bar dataKey="amount" fill="#f97316" radius={[3, 3, 0, 0]} />
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
          Expense Records
          <span className="ml-2 text-xs font-normal text-zinc-400">({filtered.length})</span>
        </h2>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">No expenses found for this period.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Code</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Description</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Category</th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-400">Date</th>
                  <th className="pb-2 text-right text-xs font-medium text-zinc-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice()
                  .sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : -1))
                  .map((e) => (
                    <tr key={e.id} className="border-b border-zinc-50">
                      <td className="py-2 font-mono text-xs text-zinc-500">{e.expenseCode}</td>
                      <td className="py-2 text-zinc-900">{e.description}</td>
                      <td className="py-2 text-zinc-500">
                        {expenseCategories.find((c) => c.id === e.categoryId)?.name ?? '—'}
                      </td>
                      <td className="py-2 text-zinc-500">{formatDisplayDate(e.expenseDate)}</td>
                      <td className="py-2 text-right font-medium text-zinc-900">
                        {fmtCurrency(e.amount)}
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
