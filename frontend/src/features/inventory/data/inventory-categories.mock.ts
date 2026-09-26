import type { InventoryCategory } from '../types/inventory.types'

export const inventoryCategoriesMockData: InventoryCategory[] = [
  { id: 'icat001', name: 'Supplements', description: 'Protein, creatine, and other supplements', status: 'ACTIVE' },
  { id: 'icat002', name: 'Cleaning Supplies', description: 'Floor cleaners, disinfectants, and sprays', status: 'ACTIVE' },
  { id: 'icat003', name: 'Towels & Laundry', description: 'Bath towels, hand towels, and laundry items', status: 'ACTIVE' },
  { id: 'icat004', name: 'Beverages', description: 'Water, energy drinks, and other beverages', status: 'ACTIVE' },
  { id: 'icat005', name: 'Stationery', description: 'Paper, pens, and office supplies', status: 'ACTIVE' },
  { id: 'icat006', name: 'First Aid', description: 'First aid kits, bandages, and medical supplies', status: 'ACTIVE' },
  { id: 'icat007', name: 'Gym Supplies', description: 'Chalk, gloves, belts, and training accessories', status: 'ACTIVE' },
  { id: 'icat008', name: 'Other', description: 'Miscellaneous inventory items', status: 'ACTIVE' },
  { id: 'icat009', name: 'Sports Nutrition', description: 'Retired — merged into Supplements', status: 'INACTIVE' },
]
