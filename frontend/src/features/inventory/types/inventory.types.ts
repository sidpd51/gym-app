export type InventoryItemStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
export type InventoryTransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'

export const INVENTORY_STATUS_LABELS: Record<InventoryItemStatus, string> = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
}

export const INVENTORY_TRANSACTION_TYPE_LABELS: Record<InventoryTransactionType, string> = {
  STOCK_IN: 'Stock In',
  STOCK_OUT: 'Stock Out',
  ADJUSTMENT: 'Adjustment',
}

export interface InventoryCategory {
  id: string
  name: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface InventoryItem {
  id: string
  itemCode: string
  name: string
  categoryId: string
  unit: string
  currentStock: number
  minimumStock: number
  status: InventoryItemStatus
  description?: string
  createdAt: string
  updatedAt: string
}

export interface InventoryTransaction {
  id: string
  itemId: string
  type: InventoryTransactionType
  quantity: number
  transactionDate: string
  reference?: string
  notes?: string
}
