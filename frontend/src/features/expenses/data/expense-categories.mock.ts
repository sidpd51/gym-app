import type { ExpenseCategory } from '../types/expense.types'

export const expenseCategoriesMockData: ExpenseCategory[] = [
  { id: 'cat001', name: 'Rent', description: 'Monthly rent and lease payments', status: 'ACTIVE' },
  { id: 'cat002', name: 'Electricity', description: 'Electricity and utility bills', status: 'ACTIVE' },
  { id: 'cat003', name: 'Equipment', description: 'Gym equipment purchases and repairs', status: 'ACTIVE' },
  { id: 'cat004', name: 'Maintenance', description: 'Building and equipment maintenance', status: 'ACTIVE' },
  { id: 'cat005', name: 'Cleaning', description: 'Cleaning services and supplies', status: 'ACTIVE' },
  { id: 'cat006', name: 'Supplies', description: 'Office and general supplies', status: 'ACTIVE' },
  { id: 'cat007', name: 'Marketing', description: 'Advertising and promotions', status: 'ACTIVE' },
  { id: 'cat008', name: 'Salaries', description: 'Staff salaries and wages', status: 'ACTIVE' },
  { id: 'cat009', name: 'Other', description: 'Miscellaneous expenses', status: 'ACTIVE' },
  { id: 'cat010', name: 'Insurance', description: 'Liability and property insurance', status: 'INACTIVE' },
]
