import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useInventoryItem, useInventoryCategories } from './hooks/useInventory'
import { InventoryStatusBadge } from './components/InventoryStatusBadge'
import { InventoryTransactionHistory } from './components/InventoryTransactionHistory'
import { getInventoryStatus } from './utils/inventory.utils'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  )
}

export function InventoryItemDetailsPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const { item } = useInventoryItem(itemId)
  const { categories } = useInventoryCategories()

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Item not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No inventory item with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{itemId}</span> exists.
        </p>
        <Link
          to="/inventory"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </Link>
      </div>
    )
  }

  const category = categories.find((c) => c.id === item.categoryId)
  const derivedStatus = getInventoryStatus(item.currentStock, item.minimumStock)

  return (
    <div className="space-y-5">
      <Link
        to="/inventory"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-zinc-500">{item.itemCode}</p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-900">{item.name}</h1>
            <div className="mt-2">
              <InventoryStatusBadge status={derivedStatus} />
            </div>
          </div>
          <Link
            to={`/inventory/${item.id}/edit`}
            className="inline-flex shrink-0 items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Edit Item
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Item Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Item Information</h2>
          <div className="mt-4 space-y-4">
            <DetailRow label="Category" value={category?.name ?? <span className="text-zinc-400">Unknown</span>} />
            <DetailRow label="Unit" value={item.unit} />
            {item.description ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Description</p>
                <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{item.description}</p>
              </div>
            ) : (
              <DetailRow label="Description" value={<span className="text-zinc-400">—</span>} />
            )}
            <DetailRow label="Added On" value={formatLocalDate(item.createdAt)} />
            <DetailRow label="Last Updated" value={formatLocalDate(item.updatedAt)} />
          </div>
        </div>

        {/* Stock Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Stock Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Current Stock</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-900">
                {item.currentStock}{' '}
                <span className="text-base font-medium text-zinc-500">{item.unit}</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Minimum Stock</p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900">
                {item.minimumStock} {item.unit}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Stock Status</p>
              <div className="mt-0.5">
                <InventoryStatusBadge status={derivedStatus} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <InventoryTransactionHistory itemId={item.id} />
    </div>
  )
}
