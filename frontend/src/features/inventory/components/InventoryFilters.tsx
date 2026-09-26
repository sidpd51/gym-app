import { Search } from 'lucide-react'
import { inventoryCategoriesMockData } from '../data/inventory-categories.mock'
import type { InventoryItemStatus } from '../types/inventory.types'

const STATUS_OPTIONS: { value: InventoryItemStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Status' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
]

interface InventoryFiltersProps {
  search: string
  categoryFilter: string
  statusFilter: InventoryItemStatus | 'ALL'
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: InventoryItemStatus | 'ALL') => void
}

export function InventoryFilters({
  search,
  categoryFilter,
  statusFilter,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: InventoryFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by item name or code…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search inventory"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by category"
        >
          <option value="ALL">All Categories</option>
          {inventoryCategoriesMockData
            .filter((c) => c.status === 'ACTIVE')
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as InventoryItemStatus | 'ALL')}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by stock status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
