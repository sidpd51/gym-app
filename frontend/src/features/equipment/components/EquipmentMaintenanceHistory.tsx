import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useEquipmentMaintenance } from '../hooks/useEquipment'
import { MAINTENANCE_TYPE_LABELS } from '../types/equipment.types'
import type { MaintenanceType } from '../types/equipment.types'
import { cn } from '@/lib/utils'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const TYPE_CONFIG: Record<MaintenanceType, { text: string }> = {
  ROUTINE: { text: 'text-blue-600' },
  REPAIR: { text: 'text-red-600' },
  INSPECTION: { text: 'text-zinc-600' },
  REPLACEMENT: { text: 'text-amber-600' },
}

interface EquipmentMaintenanceHistoryProps {
  equipmentId: string
}

export function EquipmentMaintenanceHistory({ equipmentId }: EquipmentMaintenanceHistoryProps) {
  const { maintenance: maintenanceRaw } = useEquipmentMaintenance(equipmentId)
  const records = [...maintenanceRaw].sort((a, b) =>
    a.maintenanceDate < b.maintenanceDate ? 1 : -1,
  )

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Maintenance History
          {records.length > 0 && (
            <span className="ml-2 text-xs font-normal text-zinc-400">({records.length})</span>
          )}
        </h2>
        <Link
          to={`/equipment/${equipmentId}/maintenance/new`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Add Maintenance
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-500">No maintenance records yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            Record the first maintenance event for this equipment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                  Date
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                  Type
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                  Description
                </th>
                <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
                  Cost
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                  Performed By
                </th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                  Next Maintenance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {records.map((record) => {
                const config = TYPE_CONFIG[record.maintenanceType]
                return (
                  <tr key={record.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-600">
                      {formatLocalDate(record.maintenanceDate)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs font-medium', config.text)}>
                        {MAINTENANCE_TYPE_LABELS[record.maintenanceType]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="max-w-xs truncate text-zinc-900">{record.description}</p>
                      {record.notes && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-400">
                          {record.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-zinc-900">
                      {record.cost !== undefined ? (
                        record.cost === 0 ? (
                          <span className="text-zinc-400">—</span>
                        ) : (
                          `₹${record.cost.toLocaleString('en-IN')}`
                        )
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {record.performedBy ?? <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {record.nextMaintenanceDate ? (
                        formatLocalDate(record.nextMaintenanceDate)
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
