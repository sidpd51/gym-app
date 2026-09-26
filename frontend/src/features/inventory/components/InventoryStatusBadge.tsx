import { cn } from '@/lib/utils'
import type { InventoryItemStatus } from '../types/inventory.types'

const STATUS_CONFIG: Record<InventoryItemStatus, { dot: string; label: string; text: string }> = {
  IN_STOCK: { dot: 'bg-green-500', label: 'In Stock', text: 'text-green-700' },
  LOW_STOCK: { dot: 'bg-amber-400', label: 'Low Stock', text: 'text-amber-600' },
  OUT_OF_STOCK: { dot: 'bg-red-500', label: 'Out of Stock', text: 'text-red-600' },
}

interface InventoryStatusBadgeProps {
  status: InventoryItemStatus
}

export function InventoryStatusBadge({ status }: InventoryStatusBadgeProps) {
  const { dot, label, text } = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}
