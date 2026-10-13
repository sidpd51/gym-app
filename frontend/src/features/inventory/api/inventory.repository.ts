import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type {
  InventoryCategory,
  InventoryItem,
  InventoryItemStatus,
  InventoryTransaction,
  InventoryTransactionType,
} from '../types/inventory.types'

// Backend inventory CategoryResponse (internal/modules/inventory/inventory.go).
export interface BackendInventoryCategory {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export function mapBackendCategory(payload: BackendInventoryCategory): InventoryCategory {
  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? undefined,
    status: payload.status,
  }
}

// Backend ItemResponse. No updatedAt column — only createdAt.
export interface BackendInventoryItem {
  id: string
  itemCode: string
  name: string
  categoryId: string
  unit: string
  currentStock: number
  minimumStock: number
  status: InventoryItemStatus
  description: string | null
  createdAt: string
}

export function mapBackendItem(payload: BackendInventoryItem): InventoryItem {
  return {
    id: payload.id,
    itemCode: payload.itemCode,
    name: payload.name,
    categoryId: payload.categoryId,
    unit: payload.unit,
    currentStock: payload.currentStock,
    minimumStock: payload.minimumStock,
    status: payload.status,
    description: payload.description ?? undefined,
    createdAt: payload.createdAt,
  }
}

// Backend TransactionResponse.
export interface BackendInventoryTransaction {
  id: string
  itemId: string
  type: InventoryTransactionType
  quantity: number
  transactionDate: string
  reference: string | null
  notes: string | null
  createdAt: string
}

export function mapBackendTransaction(
  payload: BackendInventoryTransaction,
): InventoryTransaction {
  return {
    id: payload.id,
    itemId: payload.itemId,
    type: payload.type,
    quantity: payload.quantity,
    transactionDate: payload.transactionDate,
    reference: payload.reference ?? undefined,
    notes: payload.notes ?? undefined,
    createdAt: payload.createdAt,
  }
}

export interface InventoryListQuery extends ListQueryParams {
  status?: InventoryItemStatus
  categoryId?: string
}

export interface CreateInventoryItemInput {
  name: string
  categoryId: string
  unit: string
  currentStock: number
  minimumStock: number
  description?: string
}

// Backend ItemUpdate: only name/unit/minimumStock/description.
// currentStock changes exclusively via transactions; categoryId is immutable.
export interface UpdateInventoryItemInput {
  name?: string
  unit?: string
  minimumStock?: number
  description?: string
}

export interface RecordTransactionInput {
  type: InventoryTransactionType
  quantity: number
  transactionDate: string
  reference?: string
  notes?: string
}

export interface InventoryRepository {
  list(query?: InventoryListQuery): Promise<PaginatedResponse<InventoryItem>>
  getById(id: string): Promise<InventoryItem>
  create(input: CreateInventoryItemInput): Promise<InventoryItem>
  update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem>
  remove(id: string): Promise<void>
  listTransactionsByItemId(itemId: string): Promise<InventoryTransaction[]>
  // STOCK_IN adds, STOCK_OUT subtracts (409 on insufficient), ADJUSTMENT sets absolute level.
  recordTransaction(itemId: string, input: RecordTransactionInput): Promise<InventoryTransaction>
}

export interface InventoryCategoryRepository {
  list(): Promise<InventoryCategory[]>
  create(input: {
    name: string
    description?: string
    status?: 'ACTIVE' | 'INACTIVE'
  }): Promise<InventoryCategory>
  update(
    id: string,
    input: { name?: string; description?: string; status?: 'ACTIVE' | 'INACTIVE' },
  ): Promise<InventoryCategory>
  remove(id: string): Promise<void>
}

function toQuery(query?: InventoryListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    status: query?.status,
    categoryId: query?.categoryId,
  }
}

export const apiInventoryRepository: InventoryRepository = {
  async list(query?: InventoryListQuery): Promise<PaginatedResponse<InventoryItem>> {
    const res = await apiClient.get<PaginatedResponse<BackendInventoryItem>>(
      '/api/v1/inventory',
      toQuery(query),
    )
    return {
      meta: res.meta,
      data: res.data.map(mapBackendItem),
    }
  },

  async getById(id: string): Promise<InventoryItem> {
    const res = await apiClient.get<BackendInventoryItem>(`/api/v1/inventory/${id}`)
    return mapBackendItem(res)
  },

  async create(input: CreateInventoryItemInput): Promise<InventoryItem> {
    const res = await apiClient.post<BackendInventoryItem>('/api/v1/inventory', {
      name: input.name,
      categoryId: input.categoryId,
      unit: input.unit,
      currentStock: input.currentStock,
      minimumStock: input.minimumStock,
      description: input.description || undefined,
    })
    return mapBackendItem(res)
  },

  async update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem> {
    const res = await apiClient.patch<BackendInventoryItem>(`/api/v1/inventory/${id}`, input)
    return mapBackendItem(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/inventory/${id}`)
  },

  async listTransactionsByItemId(itemId: string): Promise<InventoryTransaction[]> {
    const res = await apiClient.get<BackendInventoryTransaction[]>(
      `/api/v1/inventory/${itemId}/transactions`,
    )
    return res.map(mapBackendTransaction)
  },

  async recordTransaction(
    itemId: string,
    input: RecordTransactionInput,
  ): Promise<InventoryTransaction> {
    const res = await apiClient.post<BackendInventoryTransaction>(
      `/api/v1/inventory/${itemId}/transactions`,
      {
        type: input.type,
        quantity: input.quantity,
        transactionDate: input.transactionDate,
        reference: input.reference || undefined,
        notes: input.notes || undefined,
      },
    )
    return mapBackendTransaction(res)
  },
}

export const apiInventoryCategoryRepository: InventoryCategoryRepository = {
  async list(): Promise<InventoryCategory[]> {
    const res = await apiClient.get<BackendInventoryCategory[]>('/api/v1/inventory-categories')
    return res.map(mapBackendCategory)
  },

  async create(input): Promise<InventoryCategory> {
    const res = await apiClient.post<BackendInventoryCategory>('/api/v1/inventory-categories', input)
    return mapBackendCategory(res)
  },

  async update(id: string, input): Promise<InventoryCategory> {
    const res = await apiClient.patch<BackendInventoryCategory>(
      `/api/v1/inventory-categories/${id}`,
      input,
    )
    return mapBackendCategory(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/inventory-categories/${id}`)
  },
}

export const inventoryRepository: InventoryRepository = apiInventoryRepository
export const inventoryCategoryRepository: InventoryCategoryRepository =
  apiInventoryCategoryRepository
