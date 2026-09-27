import type { AuditAction } from '../types/audit-log.types'
import { AUDIT_ACTION_LABELS } from '../types/audit-log.types'

const ACTION_STYLES: Record<AuditAction, string> = {
  CREATE: 'bg-green-50 text-green-700 border-green-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  LOGIN: 'bg-teal-50 text-teal-700 border-teal-200',
  LOGOUT: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  VIEW: 'bg-slate-50 text-slate-600 border-slate-200',
  EXPORT: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function AuditActionBadge({ action }: { action: AuditAction }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${ACTION_STYLES[action]}`}
    >
      {AUDIT_ACTION_LABELS[action]}
    </span>
  )
}
