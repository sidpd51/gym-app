import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useUsers } from '@/features/users/hooks/useUsers'
import { UserRoleBadge } from '@/features/users/components/UserRoleBadge'
import { useAuditLog } from './hooks/useAuditLogs'
import { AUDIT_ENTITY_LABELS } from './types/audit-log.types'
import { AuditActionBadge } from './components/AuditActionBadge'
import { AuditStatusBadge } from './components/AuditStatusBadge'
import { formatAuditTimestamp, extractChanges, extractOtherMetadata } from './utils/audit-log.utils'

interface DetailRowProps {
  label: string
  children: React.ReactNode
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-zinc-900">{children}</div>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function AuditLogDetailsPage() {
  const { auditLogId } = useParams<{ auditLogId: string }>()
  const { log } = useAuditLog(auditLogId)
  const { users } = useUsers()

  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Audit log not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No audit event with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{auditLogId}</span> exists.
        </p>
        <Link
          to="/audit-logs"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Audit Logs
        </Link>
      </div>
    )
  }

  const user = users.find((u) => u.id === log.userId)
  const { date, time } = formatAuditTimestamp(log.timestamp)
  const changes = log.metadata ? extractChanges(log.metadata) : []
  const otherMeta = log.metadata ? extractOtherMetadata(log.metadata) : {}
  const hasChanges = changes.length > 0
  const hasOtherMeta = Object.keys(otherMeta).length > 0

  return (
    <div className="space-y-5">
      <Link
        to="/audit-logs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Audit Logs
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-zinc-400">{log.id}</p>
            <h1 className="mt-1 text-lg font-semibold text-zinc-900">{log.description}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AuditActionBadge action={log.action} />
            <AuditStatusBadge status={log.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Event Details */}
        <SectionCard title="Event">
          <div className="space-y-4">
            <DetailRow label="Timestamp">
              {date}
              {time && <span className="ml-2 text-xs font-normal text-zinc-500">{time}</span>}
            </DetailRow>
            <DetailRow label="Action">
              <AuditActionBadge action={log.action} />
            </DetailRow>
            <DetailRow label="Status">
              <AuditStatusBadge status={log.status} />
            </DetailRow>
          </div>
        </SectionCard>

        {/* User Details */}
        <SectionCard title="Performed By">
          {user ? (
            <div className="space-y-4">
              <DetailRow label="Name">
                {user.firstName} {user.lastName}
              </DetailRow>
              <DetailRow label="Code">
                <span className="font-mono">{user.userCode}</span>
              </DetailRow>
              <DetailRow label="Role">
                <UserRoleBadge role={user.role} />
              </DetailRow>
            </div>
          ) : (
            <div className="space-y-4">
              <DetailRow label="User ID">
                <span className="font-mono">{log.userId}</span>
              </DetailRow>
              <p className="text-xs text-zinc-400">User account no longer exists.</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Target */}
      {(log.entityName ?? log.entityId) && (
        <SectionCard title="Target">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DetailRow label="Entity Type">
              {AUDIT_ENTITY_LABELS[log.entityType]}
            </DetailRow>
            {log.entityName && (
              <DetailRow label="Name">{log.entityName}</DetailRow>
            )}
            {log.entityId && (
              <DetailRow label="ID">
                <span className="font-mono text-xs">{log.entityId}</span>
              </DetailRow>
            )}
          </div>
        </SectionCard>
      )}

      {/* Description */}
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <h2 className="text-sm font-semibold text-zinc-900">Description</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">{log.description}</p>
      </div>

      {/* Change Summary */}
      {hasChanges && (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Change Summary</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th scope="col" className="py-2 pr-6 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Field
                  </th>
                  <th scope="col" className="py-2 pr-6 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Old Value
                  </th>
                  <th scope="col" className="py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                    New Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {changes.map((change, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 pr-6 font-medium text-zinc-700">{change.field}</td>
                    <td className="py-2.5 pr-6 text-zinc-500 line-through">{change.oldValue}</td>
                    <td className="py-2.5 font-medium text-zinc-900">{change.newValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other Metadata */}
      {hasOtherMeta && (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Additional Details</h2>
          <dl className="mt-4 space-y-3">
            {Object.entries(otherMeta).map(([key, value]) => (
              <div key={key} className="flex items-start gap-4">
                <dt className="w-32 shrink-0 text-xs font-medium capitalize text-zinc-500">
                  {key}
                </dt>
                <dd className="text-sm text-zinc-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
