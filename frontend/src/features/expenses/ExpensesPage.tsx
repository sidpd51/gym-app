import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useExpenses, useExpenseCategories } from './hooks/useExpenses'
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

export function ExpensesPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [methodFilter, setMethodFilter] = useState<ExpensePaymentMethod | 'ALL'>('ALL')
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL')

  const { expenses, meta, isLoading, error, refetch } = useExpenses({
    page: 1,
    pageSize: 100,
    categoryId: categoryFilter === 'ALL' ? undefined : categoryFilter,
  })
  const { categories, isLoading: categoriesLoading } = useExpenseCategories()

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  )

  // method/date/search are not backend query params — client-side
  // over the loaded page.
  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase()
    return expenses.filter((e) => {
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
  }, [expenses, categoriesById, search, methodFilter, dateFilter])

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value)
  }

  function handleMethodChange(value: ExpensePaymentMethod | 'ALL') {
    setMethodFilter(value)
  }

  function handleDateChange(value: DateFilter) {
    setDateFilter(value)
  }

  if (isLoading || categoriesLoading) {
    return (
      <div className="space-y-5" aria-label="Loading expenses">
        <div className="h-6 w-48 animate-pulse rounded bg-zinc-100" />
        <div className="h-12 animate-pulse rounded-lg bg-zinc-100" />
        <div className="space-y-3 px-5 py-6">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Expenses</h2>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Failed to load expenses</p>
          <p className="mt-1 text-xs text-zinc-500">{error.message}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Expenses</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {meta?.total ?? expenses.length} expense{(meta?.total ?? expenses.length) !== 1 ? 's' : ''}
          </p>
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
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onMethodChange={handleMethodChange}
        onDateChange={handleDateChange}
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
