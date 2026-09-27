import type { InventoryItem, InventoryCategory, InventoryTransaction } from '../types/inventory.types'
import { inventoryMockData } from '../data/inventory.mock'
import { inventoryCategoriesMockData } from '../data/inventory-categories.mock'
import { inventoryTransactionsMockData } from '../data/inventory-transactions.mock'

export interface InventoryRepository {
  list(): InventoryItem[]
  getById(id: string): InventoryItem | undefined
  listCategories(): InventoryCategory[]
  listTransactionsByItemId(itemId: string): InventoryTransaction[]
}

export const mockInventoryRepository: InventoryRepository = {
  list: () => inventoryMockData,
  getById: (id) => inventoryMockData.find((item) => item.id === id),
  listCategories: () => inventoryCategoriesMockData,
  listTransactionsByItemId: (itemId) =>
    inventoryTransactionsMockData.filter((tx) => tx.itemId === itemId),
}

export const inventoryRepository: InventoryRepository = mockInventoryRepository
