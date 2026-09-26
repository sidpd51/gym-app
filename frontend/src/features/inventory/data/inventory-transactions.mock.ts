import type { InventoryTransaction } from '../types/inventory.types'

export const inventoryTransactionsMockData: InventoryTransaction[] = [
  // inv001 — Whey Protein
  {
    id: 'itxn001',
    itemId: 'inv001',
    type: 'STOCK_IN',
    quantity: 50,
    transactionDate: '2026-09-01',
    reference: 'PO-0091',
    notes: 'Monthly restock from NutriWorld.',
  },
  {
    id: 'itxn002',
    itemId: 'inv001',
    type: 'STOCK_OUT',
    quantity: 3,
    transactionDate: '2026-09-10',
    notes: 'Used for member trial sessions.',
  },
  {
    id: 'itxn003',
    itemId: 'inv001',
    type: 'STOCK_OUT',
    quantity: 2,
    transactionDate: '2026-09-20',
    notes: 'Distributed to front desk for member samples.',
  },

  // inv002 — Floor Cleaning Liquid
  {
    id: 'itxn004',
    itemId: 'inv002',
    type: 'STOCK_IN',
    quantity: 20,
    transactionDate: '2026-08-15',
    reference: 'PO-0082',
    notes: 'Bulk purchase from CleanPro.',
  },
  {
    id: 'itxn005',
    itemId: 'inv002',
    type: 'STOCK_OUT',
    quantity: 12,
    transactionDate: '2026-09-25',
    notes: 'Consumed during weekly cleaning.',
  },

  // inv003 — Bath Towels
  {
    id: 'itxn006',
    itemId: 'inv003',
    type: 'STOCK_IN',
    quantity: 40,
    transactionDate: '2026-07-01',
    reference: 'PO-0071',
  },
  {
    id: 'itxn007',
    itemId: 'inv003',
    type: 'STOCK_OUT',
    quantity: 40,
    transactionDate: '2026-09-22',
    notes: 'Discarded — worn out; replacement order pending.',
  },

  // inv004 — Mineral Water
  {
    id: 'itxn008',
    itemId: 'inv004',
    type: 'STOCK_IN',
    quantity: 200,
    transactionDate: '2026-09-15',
    reference: 'PO-0093',
    notes: 'Two crates from AquaPure.',
  },
  {
    id: 'itxn009',
    itemId: 'inv004',
    type: 'STOCK_OUT',
    quantity: 50,
    transactionDate: '2026-09-26',
    notes: 'Sold at reception counter.',
  },

  // inv005 — A4 Printer Paper
  {
    id: 'itxn010',
    itemId: 'inv005',
    type: 'STOCK_IN',
    quantity: 10,
    transactionDate: '2026-08-01',
    reference: 'PO-0081',
  },
  {
    id: 'itxn011',
    itemId: 'inv005',
    type: 'STOCK_OUT',
    quantity: 7,
    transactionDate: '2026-09-15',
    notes: 'Used for member registration forms and receipts.',
  },

  // inv007 — Gym Gloves
  {
    id: 'itxn012',
    itemId: 'inv007',
    type: 'STOCK_IN',
    quantity: 20,
    transactionDate: '2026-07-10',
    reference: 'PO-0073',
  },
  {
    id: 'itxn013',
    itemId: 'inv007',
    type: 'STOCK_OUT',
    quantity: 20,
    transactionDate: '2026-09-10',
    notes: 'Loaned to members during trial sessions; not returned.',
  },

  // inv009 — Disinfectant Spray
  {
    id: 'itxn014',
    itemId: 'inv009',
    type: 'STOCK_IN',
    quantity: 15,
    transactionDate: '2026-08-20',
    reference: 'PO-0084',
  },
  {
    id: 'itxn015',
    itemId: 'inv009',
    type: 'STOCK_OUT',
    quantity: 10,
    transactionDate: '2026-09-24',
    notes: 'Used for daily equipment wipe-downs.',
  },

  // inv010 — Protein Bars
  {
    id: 'itxn016',
    itemId: 'inv010',
    type: 'STOCK_IN',
    quantity: 15,
    transactionDate: '2026-09-01',
    reference: 'PO-0092',
    notes: 'New product trial batch.',
  },
  {
    id: 'itxn017',
    itemId: 'inv010',
    type: 'STOCK_OUT',
    quantity: 3,
    transactionDate: '2026-09-27',
    notes: 'Sold at reception.',
  },

  // inv011 — Gym Chalk
  {
    id: 'itxn018',
    itemId: 'inv011',
    type: 'STOCK_IN',
    quantity: 10,
    transactionDate: '2026-08-10',
    reference: 'PO-0083',
  },
  {
    id: 'itxn019',
    itemId: 'inv011',
    type: 'STOCK_OUT',
    quantity: 2,
    transactionDate: '2026-09-12',
    notes: 'Placed in powerlifting area.',
  },

  // inv012 — Bandage Roll
  {
    id: 'itxn020',
    itemId: 'inv012',
    type: 'STOCK_IN',
    quantity: 5,
    transactionDate: '2026-07-20',
    reference: 'PO-0074',
  },
  {
    id: 'itxn021',
    itemId: 'inv012',
    type: 'ADJUSTMENT',
    quantity: -3,
    transactionDate: '2026-09-20',
    notes: 'Stock count correction after audit.',
  },
]
