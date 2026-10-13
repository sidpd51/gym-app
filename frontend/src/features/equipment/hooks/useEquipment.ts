import { useApiDetail, useApiList, useApiQuery } from '@/lib/api/useApi'
import type { ApiError, PaginatedResponse } from '@/lib/api'
import {
  equipmentCategoryRepository,
  equipmentRepository,
  type EquipmentListQuery,
} from '../api/equipment.repository'
import type {
  Equipment,
  EquipmentCategory,
  EquipmentMaintenance,
} from '../types/equipment.types'

interface EquipmentListResult {
  equipment: Equipment[]
  meta: PaginatedResponse<Equipment>['meta'] | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async equipment list backed by GET /api/v1/equipment.
 * `equipment` defaults to [] while loading so cross-feature consumers
 * (reports, dashboards) keep working during fetch.
 */
export function useEquipment(query?: EquipmentListQuery): EquipmentListResult {
  const normalized: EquipmentListQuery = {
    page: 1,
    pageSize: 100,
    ...query,
  }
  const { data, meta, isLoading, error, refetch } = useApiList<Equipment>(
    normalized,
    (q) => equipmentRepository.list(q as EquipmentListQuery),
  )
  return { equipment: data ?? [], meta, isLoading, error, refetch }
}

interface EquipmentItemResult {
  item: Equipment | null
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/** Async equipment detail backed by GET /api/v1/equipment/{id}. */
export function useEquipmentItem(id: string | undefined): EquipmentItemResult {
  const { data, isLoading, error, refetch } = useApiDetail<Equipment>(id, (itemId) =>
    equipmentRepository.getById(itemId),
  )
  return { item: data, isLoading, error, refetch }
}

interface EquipmentCategoriesResult {
  categories: EquipmentCategory[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async category list backed by GET /api/v1/equipment-categories
 * (non-paginated array endpoint).
 */
export function useEquipmentCategories(): EquipmentCategoriesResult {
  const { data, isLoading, error, refetch } = useApiQuery<EquipmentCategory[]>(
    () => equipmentCategoryRepository.list(),
    'equipment-categories',
  )
  return { categories: data ?? [], isLoading, error, refetch }
}

interface EquipmentMaintenanceResult {
  maintenance: EquipmentMaintenance[]
  isLoading: boolean
  error: ApiError | null
  refetch: () => void
}

/**
 * Async maintenance list backed by GET /api/v1/equipment/{id}/maintenance.
 * Skips the fetch when equipmentId is undefined.
 */
export function useEquipmentMaintenance(
  equipmentId: string | undefined,
): EquipmentMaintenanceResult {
  const { data, isLoading, error, refetch } = useApiQuery<EquipmentMaintenance[]>(
    () =>
      equipmentId
        ? equipmentRepository.listMaintenanceByEquipmentId(equipmentId)
        : Promise.resolve([]),
    `equipment-maintenance-${equipmentId ?? 'none'}`,
  )
  return { maintenance: data ?? [], isLoading, error, refetch }
}
