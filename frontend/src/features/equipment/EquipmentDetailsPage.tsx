import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { equipmentCategoriesMockData } from './data/equipment-categories.mock'
import { equipmentMockData } from './data/equipment.mock'
import { equipmentMaintenanceMockData } from './data/equipment-maintenance.mock'
import { EquipmentStatusBadge } from './components/EquipmentStatusBadge'
import { EquipmentMaintenanceHistory } from './components/EquipmentMaintenanceHistory'

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

export function EquipmentDetailsPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>()
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

  const category = equipmentCategoriesMockData.find((c) => c.id === equipment.categoryId)
  const maintenanceRecords = equipmentMaintenanceMockData
    .filter((m) => m.equipmentId === equipment.id)
    .sort((a, b) => (a.maintenanceDate < b.maintenanceDate ? 1 : -1))

  const lastMaintenance = maintenanceRecords[0]
  const nextScheduled = maintenanceRecords.find((m) => m.nextMaintenanceDate)
  const totalCost = maintenanceRecords.reduce((sum, m) => sum + (m.cost ?? 0), 0)

  return (
    <div className="space-y-5">
      <Link
        to="/equipment"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Equipment
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-zinc-500">
              {equipment.equipmentCode}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-900">{equipment.name}</h1>
            <div className="mt-2">
              <EquipmentStatusBadge status={equipment.status} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/equipment/${equipment.id}/maintenance/new`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50"
            >
              Add Maintenance
            </Link>
            <Link
              to={`/equipment/${equipment.id}/edit`}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Edit Equipment
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Equipment Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Equipment Information</h2>
          <div className="mt-4 space-y-4">
            <DetailRow
              label="Category"
              value={category?.name ?? <span className="text-zinc-400">Unknown</span>}
            />
            <DetailRow
              label="Brand"
              value={equipment.brand ?? <span className="text-zinc-400">Not specified</span>}
            />
            <DetailRow
              label="Model"
              value={equipment.model ?? <span className="text-zinc-400">Not specified</span>}
            />
            <DetailRow
              label="Serial Number"
              value={
                equipment.serialNumber ? (
                  <span className="font-mono">{equipment.serialNumber}</span>
                ) : (
                  <span className="text-zinc-400">Not specified</span>
                )
              }
            />
            <DetailRow
              label="Location"
              value={equipment.location ?? <span className="text-zinc-400">Not specified</span>}
            />
          </div>
        </div>

        {/* Purchase Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Purchase Information</h2>
          {equipment.purchaseDate || equipment.purchaseCost !== undefined ? (
            <div className="mt-4 space-y-4">
              <DetailRow
                label="Purchase Date"
                value={
                  equipment.purchaseDate ? (
                    formatLocalDate(equipment.purchaseDate)
                  ) : (
                    <span className="text-zinc-400">Not recorded</span>
                  )
                }
              />
              <DetailRow
                label="Purchase Cost"
                value={
                  equipment.purchaseCost !== undefined ? (
                    `₹${equipment.purchaseCost.toLocaleString('en-IN')}`
                  ) : (
                    <span className="text-zinc-400">Not recorded</span>
                  )
                }
              />
            </div>
          ) : (
            <div className="mt-6 py-4 text-center">
              <p className="text-sm text-zinc-400">Purchase information not available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {equipment.notes && (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Notes</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">{equipment.notes}</p>
        </div>
      )}

      {/* Maintenance Summary */}
      {maintenanceRecords.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Maintenance Summary</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Records</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-900">
                {maintenanceRecords.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Last Maintenance
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900">
                {lastMaintenance ? formatLocalDate(lastMaintenance.maintenanceDate) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Next Scheduled
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900">
                {nextScheduled?.nextMaintenanceDate ? (
                  formatLocalDate(nextScheduled.nextMaintenanceDate)
                ) : (
                  <span className="text-zinc-400">Not scheduled</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Total Cost
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900">
                ₹{totalCost.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}

      <EquipmentMaintenanceHistory equipmentId={equipment.id} />
    </div>
  )
}
