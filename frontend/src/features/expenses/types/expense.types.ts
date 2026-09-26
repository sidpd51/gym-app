export type ExpensePaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
}

export interface ExpenseCategory {
  id: string
  name: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface Expense {
  id: string
  expenseCode: string
  categoryId: string
  description: string
  amount: number
  expenseDate: string
  paymentMethod: ExpensePaymentMethod
  vendor?: string
  notes?: string
  createdAt: string
}
