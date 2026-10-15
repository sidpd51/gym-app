import { useApiDetail, useApiList, useApiQuery } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import {
  expenseCategoryRepository,
  expenseRepository,
  type ExpenseListQuery,
} from '../api/expenses.repository'
import type { Expense, ExpenseCategory } from '../types/expense.types'

interface ExpensesResult {
  expenses: Expense[]
  meta: PaginatedResponse<Expense>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async expense list backed by GET /api/v1/expenses.
 * `expenses` defaults to [] while loading so existing cross-feature
 * consumers (reports, dashboards) keep working during fetch.
 */
export function useExpenses(query?: ExpenseListQuery): ExpensesResult {
  const normalized: ExpenseListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<Expense>(normalized, (q, signal) =>
    expenseRepository.list(q as ExpenseListQuery, signal),
  )
  return { expenses: data ?? [], meta, isLoading, error, refetch }
}

interface ExpenseResult {
  expense: Expense | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async expense detail backed by GET /api/v1/expenses/{id}. */
export function useExpense(id: string | undefined): ExpenseResult {
  const { data, isLoading, error, refetch } = useApiDetail<Expense>(id, (expenseId, signal) =>
    expenseRepository.getById(expenseId, signal),
  )
  return { expense: data, isLoading, error, refetch }
}

interface ExpenseCategoriesResult {
  categories: ExpenseCategory[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async category list backed by GET /api/v1/expense-categories
 * (non-paginated array endpoint).
 */
export function useExpenseCategories(): ExpenseCategoriesResult {
  const { data, isLoading, error, refetch } = useApiQuery<ExpenseCategory[]>(
    (signal) => expenseCategoryRepository.list(signal),
    '',
  )
  return { categories: data ?? [], isLoading, error, refetch }
}
