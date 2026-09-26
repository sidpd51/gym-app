import type { InventoryItemStatus } from '../types/inventory.types'

export function getInventoryStatus(currentStock: number, minimumStock: number): InventoryItemStatus {
  if (currentStock === 0) return 'OUT_OF_STOCK'
  if (currentStock <= minimumStock) return 'LOW_STOCK'
  return 'IN_STOCK'
}
