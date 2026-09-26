import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { EquipmentForm } from './components/EquipmentForm'

export function CreateEquipmentPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <Link
        to="/equipment"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Equipment
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Add Equipment</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Register a new piece of gym equipment.</p>
      </div>

      <EquipmentForm mode="create" onCancel={() => navigate('/equipment')} />
    </div>
  )
}
