import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type { Expense, ExpenseCategory, ExpensePaymentMethod } from '../types/expense.types'
import { expensesMockData } from '../data/expenses.mock'
import { expenseCategoriesMockData } from '../data/expense-categories.mock'

// Backend expense CategoryResponse (internal/modules/expense/expense.go).
export interface BackendExpenseCategory {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export function mapBackendCategory(payload: BackendExpenseCategory): ExpenseCategory {
  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? undefined,
    status: payload.status,
  }
}

// Backend expense ExpenseResponse. shopspring/decimal serializes as string.
export interface BackendExpense {
  id: string
  expenseCode: string
  categoryId: string
  description: string
  amount: number | string
  expenseDate: string
  paymentMethod: ExpensePaymentMethod
  vendor: string | null
  notes: string | null
  createdAt: string
}

export function mapBackendExpense(payload: BackendExpense): Expense {
  return {
    id: payload.id,
    expenseCode: payload.expenseCode,
    categoryId: payload.categoryId,
    description: payload.description,
    amount: Number(payload.amount),
    expenseDate: payload.expenseDate,
    paymentMethod: payload.paymentMethod,
    vendor: payload.vendor ?? undefined,
    notes: payload.notes ?? undefined,
    createdAt: payload.createdAt,
  }
}

export interface ExpenseListQuery extends ListQueryParams {
  categoryId?: string
  fromDate?: string
  toDate?: string
}

export interface CreateExpenseInput {
  categoryId: string
  description: string
  amount: number
  expenseDate: string
  paymentMethod: ExpensePaymentMethod
  vendor?: string
  notes?: string
}

export interface UpdateExpenseInput {
  categoryId?: string
  description?: string
  amount?: number
  expenseDate?: string
  paymentMethod?: ExpensePaymentMethod
  vendor?: string
  notes?: string
}

export interface ExpenseRepository {
  list(query?: ExpenseListQuery): Promise<PaginatedResponse<Expense>>
  getById(id: string): Promise<Expense>
  create(input: CreateExpenseInput): Promise<Expense>
  update(id: string, input: UpdateExpenseInput): Promise<Expense>
  remove(id: string): Promise<void>
}

export interface ExpenseCategoryRepository {
  list(): Promise<ExpenseCategory[]>
  create(input: { name: string; description?: string; status?: 'ACTIVE' | 'INACTIVE' }): Promise<ExpenseCategory>
  update(
    id: string,
    input: { name?: string; description?: string; status?: 'ACTIVE' | 'INACTIVE' },
  ): Promise<ExpenseCategory>
  remove(id: string): Promise<void>
}

function toQuery(query?: ExpenseListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    categoryId: query?.categoryId,
    fromDate: query?.fromDate,
    toDate: query?.toDate,
  }
}

export const apiExpenseRepository: ExpenseRepository = {
  async list(query?: ExpenseListQuery): Promise<PaginatedResponse<Expense>> {
    const res = await apiClient.get<PaginatedResponse<BackendExpense>>(
      '/api/v1/expenses',
      toQuery(query),
    )
    return {
      meta: res.meta,
      data: res.data.map(mapBackendExpense),
    }
  },

  async getById(id: string): Promise<Expense> {
    const res = await apiClient.get<BackendExpense>(`/api/v1/expenses/${id}`)
    return mapBackendExpense(res)
  },

  async create(input: CreateExpenseInput): Promise<Expense> {
    const res = await apiClient.post<BackendExpense>('/api/v1/expenses', {
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      expenseDate: input.expenseDate,
      paymentMethod: input.paymentMethod,
      vendor: input.vendor || undefined,
      notes: input.notes || undefined,
    })
    return mapBackendExpense(res)
  },

  async update(id: string, input: UpdateExpenseInput): Promise<Expense> {
    const res = await apiClient.patch<BackendExpense>(`/api/v1/expenses/${id}`, input)
    return mapBackendExpense(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/expenses/${id}`)
  },
}

export const apiExpenseCategoryRepository: ExpenseCategoryRepository = {
  async list(): Promise<ExpenseCategory[]> {
    const res = await apiClient.get<BackendExpenseCategory[]>('/api/v1/expense-categories')
    return res.map(mapBackendCategory)
  },

  async create(input): Promise<ExpenseCategory> {
    const res = await apiClient.post<BackendExpenseCategory>('/api/v1/expense-categories', input)
    return mapBackendCategory(res)
  },

  async update(id: string, input): Promise<ExpenseCategory> {
    const res = await apiClient.patch<BackendExpenseCategory>(`/api/v1/expense-categories/${id}`, input)
    return mapBackendCategory(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/expense-categories/${id}`)
  },
}

// Kept for unit tests / offline reference. No longer the default.
export const mockExpenseRepository = {
  list: (): Expense[] => expensesMockData,
  getById: (id: string): Expense | undefined => expensesMockData.find((e) => e.id === id),
}

export const mockExpenseCategoryRepository = {
  list: (): ExpenseCategory[] => expenseCategoriesMockData,
  getById: (id: string): ExpenseCategory | undefined =>
    expenseCategoriesMockData.find((c) => c.id === id),
}

export const expenseRepository: ExpenseRepository = apiExpenseRepository
export const expenseCategoryRepository: ExpenseCategoryRepository = apiExpenseCategoryRepository
