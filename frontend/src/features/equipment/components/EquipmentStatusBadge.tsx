import { cn } from '@/lib/utils'
import type { EquipmentStatus } from '../types/equipment.types'

const STATUS_CONFIG: Record<EquipmentStatus, { dot: string; label: string; text: string }> = {
  ACTIVE: { dot: 'bg-green-500', label: 'Active', text: 'text-green-700' },
  UNDER_MAINTENANCE: { dot: 'bg-amber-400', label: 'Under Maintenance', text: 'text-amber-600' },
  OUT_OF_SERVICE: { dot: 'bg-red-500', label: 'Out of Service', text: 'text-red-600' },
  RETIRED: { dot: 'bg-zinc-400', label: 'Retired', text: 'text-zinc-500' },
}

interface EquipmentStatusBadgeProps {
  status: EquipmentStatus
}

export function EquipmentStatusBadge({ status }: EquipmentStatusBadgeProps) {
  const { dot, label, text } = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}
