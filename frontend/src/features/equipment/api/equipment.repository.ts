import type { Equipment, EquipmentCategory, EquipmentMaintenance } from '../types/equipment.types'
import { equipmentMockData } from '../data/equipment.mock'
import { equipmentCategoriesMockData } from '../data/equipment-categories.mock'
import { equipmentMaintenanceMockData } from '../data/equipment-maintenance.mock'

export interface EquipmentRepository {
  list(): Equipment[]
  getById(id: string): Equipment | undefined
  listCategories(): EquipmentCategory[]
  listMaintenanceByEquipmentId(equipmentId: string): EquipmentMaintenance[]
}

export const mockEquipmentRepository: EquipmentRepository = {
  list: () => equipmentMockData,
  getById: (id) => equipmentMockData.find((item) => item.id === id),
  listCategories: () => equipmentCategoriesMockData,
  listMaintenanceByEquipmentId: (equipmentId) =>
    equipmentMaintenanceMockData.filter((m) => m.equipmentId === equipmentId),
}

export const equipmentRepository: EquipmentRepository = mockEquipmentRepository
