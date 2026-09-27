import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useExpense, useExpenseCategories } from './hooks/useExpenses'
import { EXPENSE_PAYMENT_METHOD_LABELS } from './types/expense.types'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  )
}

export function ExpenseDetailsPage() {
  const { expenseId } = useParams<{ expenseId: string }>()
  const { expense } = useExpense(expenseId)
  const { categories } = useExpenseCategories()

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Expense not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No expense with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{expenseId}</span> exists.
        </p>
        <Link
          to="/expenses"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Expenses
        </Link>
      </div>
    )
  }

  const category = categories.find((c) => c.id === expense.categoryId)

  return (
    <div className="space-y-5">
      <Link
        to="/expenses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Expenses
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-zinc-500">{expense.expenseCode}</p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-900">{expense.description}</h1>
            <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
              ₹{expense.amount.toLocaleString('en-IN')}
            </p>
          </div>

          <Link
            to={`/expenses/${expense.id}/edit`}
            className="inline-flex shrink-0 items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Edit Expense
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Expense Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Expense Information</h2>
          <div className="mt-4 space-y-4">
            <DetailRow
              label="Category"
              value={category?.name ?? <span className="text-zinc-400">Unknown</span>}
            />
            <DetailRow
              label="Expense Date"
              value={formatLocalDate(expense.expenseDate)}
            />
            <DetailRow
              label="Payment Method"
              value={EXPENSE_PAYMENT_METHOD_LABELS[expense.paymentMethod]}
            />
            <DetailRow label="Recorded On" value={formatLocalDate(expense.createdAt)} />
          </div>
        </div>

        {/* Additional Details */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Additional Details</h2>
          <div className="mt-4 space-y-4">
            <DetailRow
              label="Vendor"
              value={expense.vendor ?? <span className="text-zinc-400">Not specified</span>}
            />
            {expense.notes ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Notes</p>
                <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{expense.notes}</p>
              </div>
            ) : (
              <DetailRow label="Notes" value={<span className="text-zinc-400">—</span>} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
