import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { inventoryMockData } from './data/inventory.mock'
import { InventoryItemForm } from './components/InventoryItemForm'

export function EditInventoryItemPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()

  const item = inventoryMockData.find((i) => i.id === itemId)

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

  return (
    <div className="space-y-5">
      <Link
        to={`/inventory/${item.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Item
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Edit Inventory Item</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Update the details for{' '}
          <span className="font-mono font-medium text-zinc-700">{item.itemCode}</span>.
        </p>
      </div>

      <InventoryItemForm
        mode="edit"
        defaultValues={{
          name: item.name,
          categoryId: item.categoryId,
          unit: item.unit,
          minimumStock: String(item.minimumStock),
          description: item.description ?? '',
        }}
        onCancel={() => navigate(`/inventory/${item.id}`)}
      />
    </div>
  )
}
