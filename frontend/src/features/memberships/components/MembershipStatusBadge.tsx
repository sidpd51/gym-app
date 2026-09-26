import { cn } from '@/lib/utils'
import type { MembershipStatus } from '../types/membership.types'

const STATUS_CONFIG: Record<MembershipStatus, { dot: string; label: string; text: string }> = {
  ACTIVE: { dot: 'bg-green-500', label: 'Active', text: 'text-green-700' },
  EXPIRED: { dot: 'bg-red-400', label: 'Expired', text: 'text-red-700' },
  CANCELLED: { dot: 'bg-zinc-400', label: 'Cancelled', text: 'text-zinc-500' },
}

interface MembershipStatusBadgeProps {
  status: MembershipStatus
}

export function MembershipStatusBadge({ status }: MembershipStatusBadgeProps) {
  const { dot, label, text } = STATUS_CONFIG[status]

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}
