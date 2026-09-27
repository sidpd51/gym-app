import { equipmentRepository } from '../api/equipment.repository'
import type { Equipment, EquipmentCategory, EquipmentMaintenance } from '../types/equipment.types'

export function useEquipment(): { equipment: Equipment[] } {
  return { equipment: equipmentRepository.list() }
}

export function useEquipmentItem(id: string | undefined): { item: Equipment | undefined } {
  return { item: id ? equipmentRepository.getById(id) : undefined }
}

export function useEquipmentCategories(): { categories: EquipmentCategory[] } {
  return { categories: equipmentRepository.listCategories() }
}

export function useEquipmentMaintenance(equipmentId: string | undefined): {
  maintenance: EquipmentMaintenance[]
} {
  return {
    maintenance: equipmentId
      ? equipmentRepository.listMaintenanceByEquipmentId(equipmentId)
      : [],
  }
}
