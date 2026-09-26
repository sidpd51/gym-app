import type { EquipmentMaintenance } from '../types/equipment.types'

export const equipmentMaintenanceMockData: EquipmentMaintenance[] = [
  // eq001 — Treadmill
  {
    id: 'maint001',
    equipmentId: 'eq001',
    maintenanceDate: '2026-09-01',
    maintenanceType: 'ROUTINE',
    description: 'Replaced treadmill belt and lubricated running deck. Checked motor and calibrated incline.',
    cost: 2000,
    performedBy: 'FitZone Equipment Services',
    nextMaintenanceDate: '2027-03-01',
    createdAt: '2026-09-01',
  },
  {
    id: 'maint002',
    equipmentId: 'eq001',
    maintenanceDate: '2026-03-01',
    maintenanceType: 'INSPECTION',
    description: 'Quarterly inspection — belt tension, motor brush, console display. All checks passed.',
    cost: 0,
    performedBy: 'FitZone Equipment Services',
    createdAt: '2026-03-01',
  },
  {
    id: 'maint003',
    equipmentId: 'eq001',
    maintenanceDate: '2025-09-10',
    maintenanceType: 'ROUTINE',
    description: 'Annual service: belt replacement, deck lubrication, motor inspection.',
    cost: 1800,
    performedBy: 'FitZone Equipment Services',
    createdAt: '2025-09-10',
  },

  // eq002 — Exercise Bike
  {
    id: 'maint004',
    equipmentId: 'eq002',
    maintenanceDate: '2026-09-10',
    maintenanceType: 'ROUTINE',
    description: 'Tightened pedal crank bearings, cleaned drive belt, calibrated resistance levels.',
    cost: 800,
    performedBy: 'Matrix Service Centre',
    nextMaintenanceDate: '2027-03-10',
    createdAt: '2026-09-10',
  },

  // eq003 — Cross Trainer (UNDER_MAINTENANCE)
  {
    id: 'maint005',
    equipmentId: 'eq003',
    maintenanceDate: '2026-09-15',
    maintenanceType: 'REPAIR',
    description: 'Flywheel bearing replacement — equipment temporarily out of service during repair.',
    cost: 8500,
    performedBy: 'Matrix Service Centre',
    nextMaintenanceDate: '2027-03-15',
    notes: 'Parts ordered. Expected completion 30 Sep 2026.',
    createdAt: '2026-09-15',
  },
  {
    id: 'maint006',
    equipmentId: 'eq003',
    maintenanceDate: '2026-06-10',
    maintenanceType: 'ROUTINE',
    description: 'Greased stride linkage arms, checked foot pedals and handlebars for play.',
    cost: 1500,
    performedBy: 'Matrix Service Centre',
    createdAt: '2026-06-10',
  },

  // eq004 — Leg Press
  {
    id: 'maint007',
    equipmentId: 'eq004',
    maintenanceDate: '2026-08-15',
    maintenanceType: 'ROUTINE',
    description: 'Lubricated guide rails and sled mechanism. Inspected weight stack cable.',
    cost: 1200,
    performedBy: 'TechnoGym Authorised Service',
    nextMaintenanceDate: '2027-02-15',
    createdAt: '2026-08-15',
  },

  // eq005 — Smith Machine
  {
    id: 'maint008',
    equipmentId: 'eq005',
    maintenanceDate: '2026-09-01',
    maintenanceType: 'INSPECTION',
    description: 'Checked bar guides, J-hooks, and safety catches. Tightened loose fasteners.',
    cost: 0,
    performedBy: 'In-house',
    createdAt: '2026-09-01',
  },

  // eq006 — Cable Crossover (UNDER_MAINTENANCE)
  {
    id: 'maint009',
    equipmentId: 'eq006',
    maintenanceDate: '2026-09-20',
    maintenanceType: 'REPAIR',
    description: 'Upper pulley assembly failure. Cable derailed from track. Parts replaced.',
    cost: 5000,
    performedBy: 'Body-Solid Authorised Service',
    notes: 'Machine offline until repair is complete.',
    createdAt: '2026-09-20',
  },
  {
    id: 'maint010',
    equipmentId: 'eq006',
    maintenanceDate: '2026-07-01',
    maintenanceType: 'ROUTINE',
    description: 'Replaced upper and lower cables. Greased all pulleys.',
    cost: 800,
    performedBy: 'Body-Solid Authorised Service',
    createdAt: '2026-07-01',
  },

  // eq007 — Dumbbell Rack
  {
    id: 'maint011',
    equipmentId: 'eq007',
    maintenanceDate: '2026-08-01',
    maintenanceType: 'INSPECTION',
    description: 'Inspected all dumbbell handles for damage. Checked rack welds and rubber feet.',
    cost: 0,
    performedBy: 'In-house',
    createdAt: '2026-08-01',
  },

  // eq008 — EZ Curl Bar (OUT_OF_SERVICE)
  {
    id: 'maint012',
    equipmentId: 'eq008',
    maintenanceDate: '2026-05-01',
    maintenanceType: 'REPAIR',
    description: 'Assessment of knurling wear. Repair deemed uneconomical. Recommended disposal.',
    cost: 3000,
    performedBy: 'In-house',
    notes: 'Equipment decommissioned after this inspection.',
    createdAt: '2026-05-01',
  },

  // eq009 — Battle Ropes
  {
    id: 'maint013',
    equipmentId: 'eq009',
    maintenanceDate: '2026-08-20',
    maintenanceType: 'INSPECTION',
    description: 'Checked rope ends and anchor point. Minor fraying on one end — tape applied.',
    cost: 0,
    performedBy: 'In-house',
    createdAt: '2026-08-20',
  },

  // eq011 — AC Unit Main Hall
  {
    id: 'maint014',
    equipmentId: 'eq011',
    maintenanceDate: '2026-09-05',
    maintenanceType: 'ROUTINE',
    description: 'Annual servicing: cleaned coils, replaced filters, checked refrigerant pressure.',
    cost: 3500,
    performedBy: 'Daikin Authorised Service',
    nextMaintenanceDate: '2027-09-05',
    createdAt: '2026-09-05',
  },
  {
    id: 'maint015',
    equipmentId: 'eq011',
    maintenanceDate: '2025-09-10',
    maintenanceType: 'ROUTINE',
    description: 'Annual service — filter cleaning, coil cleaning, refrigerant top-up.',
    cost: 3200,
    performedBy: 'Daikin Authorised Service',
    createdAt: '2025-09-10',
  },

  // eq012 — AC Unit Changing Room (RETIRED)
  {
    id: 'maint016',
    equipmentId: 'eq012',
    maintenanceDate: '2026-07-15',
    maintenanceType: 'REPLACEMENT',
    description: 'Compressor failure confirmed. Replacement cost exceeds asset value. Unit retired.',
    cost: 0,
    performedBy: 'Daikin Authorised Service',
    notes: 'New unit procurement to be initiated.',
    createdAt: '2026-07-15',
  },
]
