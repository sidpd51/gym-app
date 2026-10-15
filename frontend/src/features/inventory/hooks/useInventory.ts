import { useApiDetail, useApiList, useApiQuery } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import {
  inventoryCategoryRepository,
  inventoryRepository,
  type InventoryListQuery,
} from '../api/inventory.repository'
import type { InventoryCategory, InventoryItem, InventoryTransaction } from '../types/inventory.types'

interface InventoryResult {
  items: InventoryItem[]
  meta: PaginatedResponse<InventoryItem>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async inventory list backed by GET /api/v1/inventory.
 * `items` defaults to [] while loading so cross-feature consumers
 * (reports, dashboards) keep working during fetch.
 */
export function useInventory(query?: InventoryListQuery): InventoryResult {
  const normalized: InventoryListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<InventoryItem>(
    normalized,
    (q, signal) => inventoryRepository.list(q as InventoryListQuery, signal),
  )
  return { items: data ?? [], meta, isLoading, error, refetch }
}

interface InventoryItemResult {
  item: InventoryItem | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async item detail backed by GET /api/v1/inventory/{id}. */
export function useInventoryItem(id: string | undefined): InventoryItemResult {
  const { data, isLoading, error, refetch } = useApiDetail<InventoryItem>(id, (itemId, signal) =>
    inventoryRepository.getById(itemId, signal),
  )
  return { item: data, isLoading, error, refetch }
}

interface InventoryCategoriesResult {
  categories: InventoryCategory[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async category list backed by GET /api/v1/inventory-categories
 * (non-paginated array endpoint).
 */
export function useInventoryCategories(): InventoryCategoriesResult {
  const { data, isLoading, error, refetch } = useApiQuery<InventoryCategory[]>(
    (signal) => inventoryCategoryRepository.list(signal),
    'inventory-categories',
  )
  return { categories: data ?? [], isLoading, error, refetch }
}

interface InventoryTransactionsResult {
  transactions: InventoryTransaction[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async transaction list backed by GET /api/v1/inventory/{id}/transactions.
 * Skips the fetch when itemId is undefined.
 */
export function useInventoryTransactions(itemId: string | undefined): InventoryTransactionsResult {
  const { data, isLoading, error, refetch } = useApiQuery<InventoryTransaction[]>(
    (signal) => (itemId ? inventoryRepository.listTransactionsByItemId(itemId, signal) : Promise.resolve([])),
    `inventory-transactions-${itemId ?? 'none'}`,
  )
  return { transactions: data ?? [], isLoading, error, refetch }
}
