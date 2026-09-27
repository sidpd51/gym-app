import type { AuditStatus } from '../types/audit-log.types'
import { AUDIT_STATUS_LABELS } from '../types/audit-log.types'

const STATUS_STYLES: Record<AuditStatus, string> = {
  SUCCESS: 'bg-green-50 text-green-700 border-green-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
}

export function AuditStatusBadge({ status }: { status: AuditStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {AUDIT_STATUS_LABELS[status]}
    </span>
  )
}
