import type { MembershipPlanStatus } from '../types/membership-plan.types'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<MembershipPlanStatus, { dot: string; label: string; text: string }> = {
  ACTIVE: { dot: 'bg-green-500', label: 'Active', text: 'text-green-700' },
  INACTIVE: { dot: 'bg-zinc-400', label: 'Inactive', text: 'text-zinc-500' },
}

interface MembershipPlanStatusBadgeProps {
  status: MembershipPlanStatus
}

export function MembershipPlanStatusBadge({ status }: MembershipPlanStatusBadgeProps) {
  const { dot, label, text } = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}
