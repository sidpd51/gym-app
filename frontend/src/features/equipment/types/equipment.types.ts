export type EquipmentStatus = 'ACTIVE' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE' | 'RETIRED'
export type MaintenanceType = 'ROUTINE' | 'REPAIR' | 'INSPECTION' | 'REPLACEMENT'

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  ACTIVE: 'Active',
  UNDER_MAINTENANCE: 'Under Maintenance',
  OUT_OF_SERVICE: 'Out of Service',
  RETIRED: 'Retired',
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  ROUTINE: 'Routine',
  REPAIR: 'Repair',
  INSPECTION: 'Inspection',
  REPLACEMENT: 'Replacement',
}

export interface EquipmentCategory {
  id: string
  name: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface Equipment {
  id: string
  equipmentCode: string
  name: string
  categoryId: string
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  purchaseCost?: number
  location?: string
  status: EquipmentStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface EquipmentMaintenance {
  id: string
  equipmentId: string
  maintenanceDate: string
  maintenanceType: MaintenanceType
  description: string
  cost?: number
  performedBy?: string
  nextMaintenanceDate?: string
  notes?: string
  createdAt: string
}
