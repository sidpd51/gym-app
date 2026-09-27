import { inventoryRepository } from '../api/inventory.repository'
import type { InventoryItem, InventoryCategory, InventoryTransaction } from '../types/inventory.types'

export function useInventory(): { items: InventoryItem[] } {
  return { items: inventoryRepository.list() }
}

export function useInventoryItem(id: string | undefined): { item: InventoryItem | undefined } {
  return { item: id ? inventoryRepository.getById(id) : undefined }
}

export function useInventoryCategories(): { categories: InventoryCategory[] } {
  return { categories: inventoryRepository.listCategories() }
}

export function useInventoryTransactions(itemId: string | undefined): {
  transactions: InventoryTransaction[]
} {
  return {
    transactions: itemId ? inventoryRepository.listTransactionsByItemId(itemId) : [],
  }
}
