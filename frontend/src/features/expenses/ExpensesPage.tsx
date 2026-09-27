import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { expenseCategoriesMockData } from './data/expense-categories.mock'
import { expensesMockData } from './data/expenses.mock'
import { ExpenseFilters } from './components/ExpenseFilters'
import { ExpenseTable } from './components/ExpenseTable'
import type { DateFilter } from './components/ExpenseFilters'
import type { ExpensePaymentMethod } from './types/expense.types'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

function matchesDateFilter(dateStr: string, filter: DateFilter): boolean {
  if (filter === 'ALL') return true
  const [y, m, d] = dateStr.split('-').map(Number)
  const expDate = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (filter === 'TODAY') {
    return expDate.getTime() === today.getTime()
  }
  if (filter === 'THIS_WEEK') {
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    return expDate >= monday && expDate <= today
  }
  if (filter === 'THIS_MONTH') {
    return (
      expDate.getFullYear() === today.getFullYear() &&
      expDate.getMonth() === today.getMonth()
    )
  }
  return true
}

const categoriesById = Object.fromEntries(expenseCategoriesMockData.map((c) => [c.id, c]))

export function ExpensesPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [methodFilter, setMethodFilter] = useState<ExpensePaymentMethod | 'ALL'>('ALL')
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL')

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase()
    return expensesMockData.filter((e) => {
      if (categoryFilter !== 'ALL' && e.categoryId !== categoryFilter) return false
      if (methodFilter !== 'ALL' && e.paymentMethod !== methodFilter) return false
      if (!matchesDateFilter(e.expenseDate, dateFilter)) return false
      if (q) {
        const code = e.expenseCode.toLowerCase()
        const desc = e.description.toLowerCase()
        const vendor = (e.vendor ?? '').toLowerCase()
        const catName = (categoriesById[e.categoryId]?.name ?? '').toLowerCase()
        if (
          !code.includes(q) &&
          !desc.includes(q) &&
          !vendor.includes(q) &&
          !catName.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [search, categoryFilter, methodFilter, dateFilter])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Expenses</h2>
          <p className="mt-0.5 text-sm text-zinc-500">Track gym operating expenses.</p>
        </div>
        <PermissionGate permission="expenses:create">
          <Link
            to="/expenses/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Record Expense
          </Link>
        </PermissionGate>
      </div>

      <ExpenseFilters
        search={search}
        categoryFilter={categoryFilter}
        methodFilter={methodFilter}
        dateFilter={dateFilter}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryFilter}
        onMethodChange={setMethodFilter}
        onDateChange={setDateFilter}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <ExpenseTable expenses={filteredExpenses} categoriesById={categoriesById} />
      </div>
    </div>
  )
}
