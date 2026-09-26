import { cn } from '@/lib/utils'
import type { PaymentStatus } from '../types/payment.types'

const STATUS_CONFIG: Record<PaymentStatus, { dot: string; label: string; text: string }> = {
  COMPLETED: { dot: 'bg-green-500', label: 'Completed', text: 'text-green-700' },
  PENDING: { dot: 'bg-amber-400', label: 'Pending', text: 'text-amber-700' },
  REFUNDED: { dot: 'bg-zinc-400', label: 'Refunded', text: 'text-zinc-500' },
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const { dot, label, text } = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}
