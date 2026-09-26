import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { equipmentCategoriesMockData } from './data/equipment-categories.mock'
import { equipmentMockData } from './data/equipment.mock'
import { EquipmentFilters } from './components/EquipmentFilters'
import { EquipmentTable } from './components/EquipmentTable'
import type { EquipmentStatus } from './types/equipment.types'

const categoriesById = Object.fromEntries(equipmentCategoriesMockData.map((c) => [c.id, c]))

export function EquipmentPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'ALL'>('ALL')

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return equipmentMockData.filter((item) => {
      if (categoryFilter !== 'ALL' && item.categoryId !== categoryFilter) return false
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false

      if (q) {
        const name = item.name.toLowerCase()
        const code = item.equipmentCode.toLowerCase()
        const brand = (item.brand ?? '').toLowerCase()
        const model = (item.model ?? '').toLowerCase()
        const serial = (item.serialNumber ?? '').toLowerCase()
        if (
          !name.includes(q) &&
          !code.includes(q) &&
          !brand.includes(q) &&
          !model.includes(q) &&
          !serial.includes(q)
        ) {
          return false
        }
      }

      return true
    })
  }, [search, categoryFilter, statusFilter])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Equipment</h2>
          <p className="mt-0.5 text-sm text-zinc-500">Track gym assets and maintenance history.</p>
        </div>
        <Link
          to="/equipment/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Equipment
        </Link>
      </div>

      <EquipmentFilters
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
        <EquipmentTable items={filteredItems} categoriesById={categoriesById} />
      </div>
    </div>
  )
}
