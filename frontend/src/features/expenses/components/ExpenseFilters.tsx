import { Search } from 'lucide-react'
import { expenseCategoriesMockData } from '../data/expense-categories.mock'
import { EXPENSE_PAYMENT_METHOD_LABELS } from '../types/expense.types'
import type { ExpensePaymentMethod } from '../types/expense.types'

export type DateFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'ALL', label: 'All Dates' },
  { value: 'TODAY', label: 'Today' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
]

const METHOD_OPTIONS: { value: ExpensePaymentMethod | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Methods' },
  ...Object.entries(EXPENSE_PAYMENT_METHOD_LABELS).map(([value, label]) => ({
    value: value as ExpensePaymentMethod,
    label,
  })),
]

interface ExpenseFiltersProps {
  search: string
  categoryFilter: string
  methodFilter: ExpensePaymentMethod | 'ALL'
  dateFilter: DateFilter
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onMethodChange: (value: ExpensePaymentMethod | 'ALL') => void
  onDateChange: (value: DateFilter) => void
}

export function ExpenseFilters({
  search,
  categoryFilter,
  methodFilter,
  dateFilter,
  onSearchChange,
  onCategoryChange,
  onMethodChange,
  onDateChange,
}: ExpenseFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by code, description, vendor or category…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search expenses"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by category"
        >
          <option value="ALL">All Categories</option>
          {expenseCategoriesMockData.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={methodFilter}
          onChange={(e) => onMethodChange(e.target.value as ExpensePaymentMethod | 'ALL')}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by payment method"
        >
          {METHOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value as DateFilter)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by date"
        >
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
