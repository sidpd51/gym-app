export interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface ExpenseRow {
  id: string;
  expense_code: string;
  category_id: string;
  description: string;
  amount: string;
  expense_date: string;
  payment_method: string;
  vendor: string | null;
  notes: string | null;
  created_at: Date;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface ExpenseResponse {
  id: string;
  expenseCode: string;
  categoryId: string;
  description: string;
  amount: string;
  expenseDate: string;
  paymentMethod: string;
  vendor: string | null;
  notes: string | null;
  createdAt: Date;
}

/** Go's decimal.Decimal JSON is a string without trailing zeros ("100.00" -> "100"). */
export function decimalString(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

export const toCategoryResponse = (c: CategoryRow): CategoryResponse => ({
  id: c.id,
  name: c.name,
  description: c.description,
  status: c.status,
});

export const toExpenseResponse = (e: ExpenseRow): ExpenseResponse => ({
  id: e.id,
  expenseCode: e.expense_code,
  categoryId: e.category_id,
  description: e.description,
  amount: decimalString(e.amount),
  expenseDate: e.expense_date,
  paymentMethod: e.payment_method,
  vendor: e.vendor,
  notes: e.notes,
  createdAt: e.created_at,
});
