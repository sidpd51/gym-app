import { expenseRepository } from '../api/expenses.repository'
import type { Expense, ExpenseCategory } from '../types/expense.types'

export function useExpenses(): { expenses: Expense[] } {
  return { expenses: expenseRepository.list() }
}

export function useExpense(id: string | undefined): { expense: Expense | undefined } {
  return { expense: id ? expenseRepository.getById(id) : undefined }
}

export function useExpenseCategories(): { categories: ExpenseCategory[] } {
  return { categories: expenseRepository.listCategories() }
}
