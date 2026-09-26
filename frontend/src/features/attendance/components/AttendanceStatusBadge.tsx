import { cn } from '@/lib/utils'
import type { AttendanceStatus } from '../types/attendance.types'

const STATUS_CONFIG: Record<AttendanceStatus, { dot: string; label: string; text: string }> = {
  PRESENT: { dot: 'bg-green-500', label: 'Present', text: 'text-green-700' },
}

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
}

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  const { dot, label, text } = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}
