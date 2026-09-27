import { Activity, CalendarDays, CheckCircle2, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AuditLog } from '../types/audit-log.types'
import { isTodayTimestamp } from '../utils/audit-log.utils'

interface SummaryCardProps {
  icon: LucideIcon
  label: string
  value: number
  iconClass: string
}

function SummaryCard({ icon: Icon, label, value, iconClass }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon size={16} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

interface AuditLogSummaryProps {
  logs: AuditLog[]
}

export function AuditLogSummary({ logs }: AuditLogSummaryProps) {
  const successful = logs.filter((l) => l.status === 'SUCCESS').length
  const failed = logs.filter((l) => l.status === 'FAILED').length
  const todaysEvents = logs.filter((l) => isTodayTimestamp(l.timestamp)).length

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <SummaryCard
        icon={Activity}
        label="Total Events"
        value={logs.length}
        iconClass="bg-zinc-100 text-zinc-600"
      />
      <SummaryCard
        icon={CheckCircle2}
        label="Successful"
        value={successful}
        iconClass="bg-green-100 text-green-600"
      />
      <SummaryCard
        icon={XCircle}
        label="Failed"
        value={failed}
        iconClass="bg-red-100 text-red-600"
      />
      <SummaryCard
        icon={CalendarDays}
        label="Today's Events"
        value={todaysEvents}
        iconClass="bg-blue-100 text-blue-600"
      />
    </div>
  )
}
