import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ExpenseForm } from './components/ExpenseForm'

export function CreateExpensePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <Link
        to="/expenses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Expenses
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Record Expense</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Record a new gym operating expense.</p>
      </div>

      <ExpenseForm mode="create" onCancel={() => navigate('/expenses')} />
    </div>
  )
}
