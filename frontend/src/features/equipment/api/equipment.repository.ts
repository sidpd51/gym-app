import { apiClient } from '@/lib/api'
import type { ListQueryParams, PaginatedResponse } from '@/lib/api'
import type {
  Equipment,
  EquipmentCategory,
  EquipmentMaintenance,
  EquipmentStatus,
  MaintenanceType,
} from '../types/equipment.types'

// Backend equipment CategoryResponse (internal/modules/equipment/equipment.go).
export interface BackendEquipmentCategory {
  id: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export function mapBackendCategory(payload: BackendEquipmentCategory): EquipmentCategory {
  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? undefined,
    status: payload.status,
  }
}

// Backend EquipmentResponse. purchaseCost is shopspring/decimal -> JSON string.
// No updatedAt column.
export interface BackendEquipment {
  id: string
  equipmentCode: string
  name: string
  categoryId: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  purchaseDate: string | null
  purchaseCost: number | string | null
  location: string | null
  status: EquipmentStatus
  notes: string | null
  createdAt: string
}

export function mapBackendEquipment(payload: BackendEquipment): Equipment {
  return {
    id: payload.id,
    equipmentCode: payload.equipmentCode,
    name: payload.name,
    categoryId: payload.categoryId,
    brand: payload.brand ?? undefined,
    model: payload.model ?? undefined,
    serialNumber: payload.serialNumber ?? undefined,
    purchaseDate: payload.purchaseDate ?? undefined,
    purchaseCost:
      payload.purchaseCost !== null && payload.purchaseCost !== undefined
        ? Number(payload.purchaseCost)
        : undefined,
    location: payload.location ?? undefined,
    status: payload.status,
    notes: payload.notes ?? undefined,
    createdAt: payload.createdAt,
  }
}

// Backend MaintenanceResponse. cost is decimal -> JSON string.
export interface BackendMaintenance {
  id: string
  equipmentId: string
  maintenanceDate: string
  maintenanceType: MaintenanceType
  description: string
  cost: number | string | null
  performedBy: string | null
  nextMaintenanceDate: string | null
  notes: string | null
  createdAt: string
}

export function mapBackendMaintenance(payload: BackendMaintenance): EquipmentMaintenance {
  return {
    id: payload.id,
    equipmentId: payload.equipmentId,
    maintenanceDate: payload.maintenanceDate,
    maintenanceType: payload.maintenanceType,
    description: payload.description,
    cost:
      payload.cost !== null && payload.cost !== undefined ? Number(payload.cost) : undefined,
    performedBy: payload.performedBy ?? undefined,
    nextMaintenanceDate: payload.nextMaintenanceDate ?? undefined,
    notes: payload.notes ?? undefined,
    createdAt: payload.createdAt,
  }
}

export interface EquipmentListQuery extends ListQueryParams {
  status?: EquipmentStatus
  categoryId?: string
}

export interface CreateEquipmentInput {
  name: string
  categoryId: string
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  purchaseCost?: number
  location?: string
  status?: EquipmentStatus
  notes?: string
}

// Backend EquipmentUpdate: no categoryId/purchaseDate/purchaseCost —
// those are immutable after creation.
export interface UpdateEquipmentInput {
  name?: string
  brand?: string
  model?: string
  serialNumber?: string
  location?: string
  status?: EquipmentStatus
  notes?: string
}

export interface RecordMaintenanceInput {
  maintenanceDate: string
  maintenanceType: MaintenanceType
  description: string
  cost?: number
  performedBy?: string
  nextMaintenanceDate?: string
  notes?: string
}

export interface EquipmentRepository {
  list(query?: EquipmentListQuery): Promise<PaginatedResponse<Equipment>>
  getById(id: string): Promise<Equipment>
  create(input: CreateEquipmentInput): Promise<Equipment>
  update(id: string, input: UpdateEquipmentInput): Promise<Equipment>
  remove(id: string): Promise<void>
  listMaintenanceByEquipmentId(equipmentId: string): Promise<EquipmentMaintenance[]>
  recordMaintenance(
    equipmentId: string,
    input: RecordMaintenanceInput,
  ): Promise<EquipmentMaintenance>
}

export interface EquipmentCategoryRepository {
  list(): Promise<EquipmentCategory[]>
  create(input: {
    name: string
    description?: string
    status?: 'ACTIVE' | 'INACTIVE'
  }): Promise<EquipmentCategory>
  update(
    id: string,
    input: { name?: string; description?: string; status?: 'ACTIVE' | 'INACTIVE' },
  ): Promise<EquipmentCategory>
  remove(id: string): Promise<void>
}

function toQuery(query?: EquipmentListQuery): ListQueryParams {
  return {
    page: query?.page ?? 1,
    pageSize: query?.pageSize ?? 100,
    status: query?.status,
    categoryId: query?.categoryId,
  }
}

export const apiEquipmentRepository: EquipmentRepository = {
  async list(query?: EquipmentListQuery): Promise<PaginatedResponse<Equipment>> {
    const res = await apiClient.get<PaginatedResponse<BackendEquipment>>(
      '/api/v1/equipment',
      toQuery(query),
    )
    return {
      meta: res.meta,
      data: res.data.map(mapBackendEquipment),
    }
  },

  async getById(id: string): Promise<Equipment> {
    const res = await apiClient.get<BackendEquipment>(`/api/v1/equipment/${id}`)
    return mapBackendEquipment(res)
  },

  async create(input: CreateEquipmentInput): Promise<Equipment> {
    const res = await apiClient.post<BackendEquipment>('/api/v1/equipment', {
      name: input.name,
      categoryId: input.categoryId,
      brand: input.brand || undefined,
      model: input.model || undefined,
      serialNumber: input.serialNumber || undefined,
      purchaseDate: input.purchaseDate || undefined,
      purchaseCost: input.purchaseCost,
      location: input.location || undefined,
      status: input.status,
      notes: input.notes || undefined,
    })
    return mapBackendEquipment(res)
  },

  async update(id: string, input: UpdateEquipmentInput): Promise<Equipment> {
    const res = await apiClient.patch<BackendEquipment>(`/api/v1/equipment/${id}`, input)
    return mapBackendEquipment(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/equipment/${id}`)
  },

  async listMaintenanceByEquipmentId(equipmentId: string): Promise<EquipmentMaintenance[]> {
    const res = await apiClient.get<BackendMaintenance[]>(
      `/api/v1/equipment/${equipmentId}/maintenance`,
    )
    return res.map(mapBackendMaintenance)
  },

  async recordMaintenance(
    equipmentId: string,
    input: RecordMaintenanceInput,
  ): Promise<EquipmentMaintenance> {
    const res = await apiClient.post<BackendMaintenance>(
      `/api/v1/equipment/${equipmentId}/maintenance`,
      {
        maintenanceDate: input.maintenanceDate,
        maintenanceType: input.maintenanceType,
        description: input.description,
        cost: input.cost,
        performedBy: input.performedBy || undefined,
        nextMaintenanceDate: input.nextMaintenanceDate || undefined,
        notes: input.notes || undefined,
      },
    )
    return mapBackendMaintenance(res)
  },
}

export const apiEquipmentCategoryRepository: EquipmentCategoryRepository = {
  async list(): Promise<EquipmentCategory[]> {
    const res = await apiClient.get<BackendEquipmentCategory[]>('/api/v1/equipment-categories')
    return res.map(mapBackendCategory)
  },

  async create(input): Promise<EquipmentCategory> {
    const res = await apiClient.post<BackendEquipmentCategory>('/api/v1/equipment-categories', input)
    return mapBackendCategory(res)
  },

  async update(id: string, input): Promise<EquipmentCategory> {
    const res = await apiClient.patch<BackendEquipmentCategory>(
      `/api/v1/equipment-categories/${id}`,
      input,
    )
    return mapBackendCategory(res)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/equipment-categories/${id}`)
  },
}

export const equipmentRepository: EquipmentRepository = apiEquipmentRepository
export const equipmentCategoryRepository: EquipmentCategoryRepository =
  apiEquipmentCategoryRepository
