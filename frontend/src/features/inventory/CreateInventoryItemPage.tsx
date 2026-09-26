import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { InventoryItemForm } from './components/InventoryItemForm'

export function CreateInventoryItemPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <Link
        to="/inventory"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Add Inventory Item</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Record a new item in the gym inventory.</p>
      </div>

      <InventoryItemForm mode="create" onCancel={() => navigate('/inventory')} />
    </div>
  )
}
