import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useExpense } from './hooks/useExpenses'
import { ExpenseForm } from './components/ExpenseForm'

export function EditExpensePage() {
  const { expenseId } = useParams<{ expenseId: string }>()
  const navigate = useNavigate()

  const { expense } = useExpense(expenseId)

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

  return (
    <div className="space-y-5">
      <Link
        to={`/expenses/${expense.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Expense
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Edit Expense</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Update the details for{' '}
          <span className="font-mono font-medium text-zinc-700">{expense.expenseCode}</span>.
        </p>
      </div>

      <ExpenseForm
        mode="edit"
        defaultValues={{
          categoryId: expense.categoryId,
          description: expense.description,
          amount: String(expense.amount),
          expenseDate: expense.expenseDate,
          paymentMethod: expense.paymentMethod,
          vendor: expense.vendor ?? '',
          notes: expense.notes ?? '',
        }}
        onCancel={() => navigate(`/expenses/${expense.id}`)}
      />
    </div>
  )
}
