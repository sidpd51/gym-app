import type { Expense, ExpenseCategory } from '../types/expense.types'
import { expensesMockData } from '../data/expenses.mock'
import { expenseCategoriesMockData } from '../data/expense-categories.mock'

export interface ExpenseRepository {
  list(): Expense[]
  getById(id: string): Expense | undefined
  listCategories(): ExpenseCategory[]
  getCategoryById(id: string): ExpenseCategory | undefined
}

export const mockExpenseRepository: ExpenseRepository = {
  list: () => expensesMockData,
  getById: (id) => expensesMockData.find((item) => item.id === id),
  listCategories: () => expenseCategoriesMockData,
  getCategoryById: (id) => expenseCategoriesMockData.find((item) => item.id === id),
}

export const expenseRepository: ExpenseRepository = mockExpenseRepository
