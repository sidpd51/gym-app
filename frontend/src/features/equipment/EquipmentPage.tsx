import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useEquipment, useEquipmentCategories } from './hooks/useEquipment'
import { EquipmentFilters } from './components/EquipmentFilters'
import { EquipmentTable } from './components/EquipmentTable'
import type { EquipmentStatus } from './types/equipment.types'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export function EquipmentPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'ALL'>('ALL')

  const { equipment, meta, isLoading, error, refetch } = useEquipment({
    page: 1,
    pageSize: 100,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    categoryId: categoryFilter === 'ALL' ? undefined : categoryFilter,
  })
  const { categories, isLoading: categoriesLoading } = useEquipmentCategories()
  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]))

  // search is not a backend query param — client-side over the loaded page.
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return equipment
    return equipment.filter((item) => {
      const name = item.name.toLowerCase()
      const code = item.equipmentCode.toLowerCase()
      const brand = (item.brand ?? '').toLowerCase()
      const model = (item.model ?? '').toLowerCase()
      const serial = (item.serialNumber ?? '').toLowerCase()
      return (
        name.includes(q) ||
        code.includes(q) ||
        brand.includes(q) ||
        model.includes(q) ||
        serial.includes(q)
      )
    })
  }, [equipment, search])

  if (isLoading || categoriesLoading) {
    return (
      <div className="space-y-5" aria-label="Loading equipment">
        <div className="h-6 w-48 animate-pulse rounded bg-zinc-100" />
        <div className="h-12 animate-pulse rounded-lg bg-zinc-100" />
        <div className="space-y-3 px-5 py-6">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-10 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Equipment</h2>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-5 py-12 text-center">
          <p className="text-sm font-medium text-zinc-700">Failed to load equipment</p>
          <p className="mt-1 text-xs text-zinc-500">{error.message}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Equipment</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {meta?.total ?? equipment.length} item
            {(meta?.total ?? equipment.length) !== 1 ? 's' : ''}
          </p>
        </div>
        <PermissionGate permission="equipment:create">
          <Link
            to="/equipment/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Equipment
          </Link>
        </PermissionGate>
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
