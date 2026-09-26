import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { equipmentMockData } from './data/equipment.mock'
import { EquipmentForm } from './components/EquipmentForm'

export function EditEquipmentPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>()
  const navigate = useNavigate()

  const equipment = equipmentMockData.find((e) => e.id === equipmentId)

  if (!equipment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Equipment not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No equipment with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{equipmentId}</span> exists.
        </p>
        <Link
          to="/equipment"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to={`/equipment/${equipment.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Equipment
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Edit Equipment</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Update the details for{' '}
          <span className="font-mono font-medium text-zinc-700">{equipment.equipmentCode}</span>.
        </p>
      </div>

      <EquipmentForm
        mode="edit"
        defaultValues={{
          name: equipment.name,
          categoryId: equipment.categoryId,
          brand: equipment.brand ?? '',
          model: equipment.model ?? '',
          serialNumber: equipment.serialNumber ?? '',
          purchaseDate: equipment.purchaseDate ?? '',
          purchaseCost: equipment.purchaseCost !== undefined ? String(equipment.purchaseCost) : '',
          location: equipment.location ?? '',
          status: equipment.status,
          notes: equipment.notes ?? '',
        }}
        onCancel={() => navigate(`/equipment/${equipment.id}`)}
      />
    </div>
  )
}
