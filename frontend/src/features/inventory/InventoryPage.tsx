import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { inventoryCategoriesMockData } from './data/inventory-categories.mock'
import { inventoryMockData } from './data/inventory.mock'
import { InventoryFilters } from './components/InventoryFilters'
import { InventoryTable } from './components/InventoryTable'
import { getInventoryStatus } from './utils/inventory.utils'
import type { InventoryItemStatus } from './types/inventory.types'

const categoriesById = Object.fromEntries(inventoryCategoriesMockData.map((c) => [c.id, c]))

export function InventoryPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<InventoryItemStatus | 'ALL'>('ALL')

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return inventoryMockData.filter((item) => {
      if (categoryFilter !== 'ALL' && item.categoryId !== categoryFilter) return false

      const derivedStatus = getInventoryStatus(item.currentStock, item.minimumStock)
      if (statusFilter !== 'ALL' && derivedStatus !== statusFilter) return false

      if (q) {
        const name = item.name.toLowerCase()
        const code = item.itemCode.toLowerCase()
        if (!name.includes(q) && !code.includes(q)) return false
      }

      return true
    })
  }, [search, categoryFilter, statusFilter])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Inventory</h2>
          <p className="mt-0.5 text-sm text-zinc-500">Track gym stock and consumable items.</p>
        </div>
        <Link
          to="/inventory/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Inventory Item
        </Link>
      </div>

      <InventoryFilters
        search={search}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <InventoryTable items={filteredItems} categoriesById={categoriesById} />
      </div>
    </div>
  )
}
