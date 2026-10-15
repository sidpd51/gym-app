export interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface EquipmentRow {
  id: string;
  equipment_code: string;
  name: string;
  category_id: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  created_at: Date;
}

export interface MaintenanceRow {
  id: string;
  equipment_id: string;
  maintenance_date: string;
  maintenance_type: string;
  description: string;
  cost: string | null;
  performed_by: string | null;
  next_maintenance_date: string | null;
  notes: string | null;
  created_at: Date;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface EquipmentResponse {
  id: string;
  equipmentCode: string;
  name: string;
  categoryId: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
}

export interface MaintenanceResponse {
  id: string;
  equipmentId: string;
  maintenanceDate: string;
  maintenanceType: string;
  description: string;
  cost: string | null;
  performedBy: string | null;
  nextMaintenanceDate: string | null;
  notes: string | null;
  createdAt: Date;
}

/** shopspring/decimal marshals as a JSON string with trailing zeros trimmed ("1500.50" -> "1500.5"). */
export function decimalOut(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return v.includes('.') ? v.replace(/0+$/, '').replace(/\.$/, '') : v;
}

export const toCategoryResponse = (c: CategoryRow): CategoryResponse => ({
  id: c.id, name: c.name, description: c.description, status: c.status,
});

export const toEquipmentResponse = (e: EquipmentRow): EquipmentResponse => ({
  id: e.id,
  equipmentCode: e.equipment_code,
  name: e.name,
  categoryId: e.category_id,
  brand: e.brand,
  model: e.model,
  serialNumber: e.serial_number,
  purchaseDate: e.purchase_date,
  purchaseCost: decimalOut(e.purchase_cost),
  location: e.location,
  status: e.status,
  notes: e.notes,
  createdAt: e.created_at,
});

export const toMaintenanceResponse = (m: MaintenanceRow): MaintenanceResponse => ({
  id: m.id,
  equipmentId: m.equipment_id,
  maintenanceDate: m.maintenance_date,
  maintenanceType: m.maintenance_type,
  description: m.description,
  cost: decimalOut(m.cost),
  performedBy: m.performed_by,
  nextMaintenanceDate: m.next_maintenance_date,
  notes: m.notes,
  createdAt: m.created_at,
});
