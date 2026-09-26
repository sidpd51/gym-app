import { cn } from '@/lib/utils'
import type { LeadStatus } from '../types/lead.types'
import { LEAD_STATUS_LABELS } from '../types/lead.types'

const STATUS_CONFIG: Record<LeadStatus, { dot: string; text: string }> = {
  NEW: { dot: 'bg-zinc-400', text: 'text-zinc-500' },
  CONTACTED: { dot: 'bg-blue-500', text: 'text-blue-700' },
  INTERESTED: { dot: 'bg-purple-500', text: 'text-purple-700' },
  FOLLOW_UP: { dot: 'bg-amber-500', text: 'text-amber-700' },
  CONVERTED: { dot: 'bg-green-500', text: 'text-green-700' },
  LOST: { dot: 'bg-red-400', text: 'text-red-600' },
}

interface LeadStatusBadgeProps {
  status: LeadStatus
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const { dot, text } = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {LEAD_STATUS_LABELS[status]}
    </span>
  )
}
