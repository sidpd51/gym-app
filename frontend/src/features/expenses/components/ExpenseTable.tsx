import { Link } from 'react-router-dom'
import type { Expense } from '../types/expense.types'
import { EXPENSE_PAYMENT_METHOD_LABELS } from '../types/expense.types'
import type { ExpenseCategory } from '../types/expense.types'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface ExpenseTableProps {
  expenses: Expense[]
  categoriesById: Record<string, ExpenseCategory>
}

export function ExpenseTable({ expenses, categoriesById }: ExpenseTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">No expenses found</p>
        <p className="mt-1 text-xs text-zinc-500">Try changing your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Code
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Description
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Category
            </th>
            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
              Amount
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Date
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Payment
            </th>
            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {expenses.map((expense) => {
            const category = categoriesById[expense.categoryId] as ExpenseCategory | undefined
            return (
              <tr key={expense.id} className="hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <Link
                    to={`/expenses/${expense.id}`}
                    className="font-mono text-xs font-medium text-blue-600 hover:underline"
                  >
                    {expense.expenseCode}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <p className="max-w-xs truncate font-medium text-zinc-900">
                    {expense.description}
                  </p>
                  {expense.vendor && (
                    <p className="text-xs text-zinc-400">{expense.vendor}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  {category?.name ?? (
                    <span className="text-zinc-400">Unknown</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-zinc-900">
                  ₹{expense.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  {formatLocalDate(expense.expenseDate)}
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  {EXPENSE_PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    to={`/expenses/${expense.id}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
