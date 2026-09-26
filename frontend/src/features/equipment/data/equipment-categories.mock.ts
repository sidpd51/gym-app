import type { EquipmentCategory } from '../types/equipment.types'

export const equipmentCategoriesMockData: EquipmentCategory[] = [
  { id: 'eqcat001', name: 'Cardio', description: 'Treadmills, bikes, cross trainers', status: 'ACTIVE' },
  { id: 'eqcat002', name: 'Strength', description: 'Weight machines, cable systems, press equipment', status: 'ACTIVE' },
  { id: 'eqcat003', name: 'Free Weights', description: 'Dumbbells, barbells, weight plates, racks', status: 'ACTIVE' },
  { id: 'eqcat004', name: 'Functional Training', description: 'Kettlebells, battle ropes, TRX, sleds', status: 'ACTIVE' },
  { id: 'eqcat005', name: 'Recovery', description: 'Foam rollers, massage guns, stretching equipment', status: 'ACTIVE' },
  { id: 'eqcat006', name: 'Facility Equipment', description: 'AC units, lockers, water coolers, CCTV', status: 'ACTIVE' },
  { id: 'eqcat007', name: 'Other', description: 'Miscellaneous gym assets', status: 'ACTIVE' },
  { id: 'eqcat008', name: 'Martial Arts', description: 'Retired — no longer offered', status: 'INACTIVE' },
]
