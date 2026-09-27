import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usersMockData } from '@/features/users/data/users.mock'
import { auditLogsMockData } from './data/audit-logs.mock'
import { AuditLogFilters } from './components/AuditLogFilters'
import { AuditLogSummary } from './components/AuditLogSummary'
import { AuditLogTable } from './components/AuditLogTable'
import type { AuditAction, AuditEntityType, AuditStatus, DateFilter } from './types/audit-log.types'
import { matchesDateFilter } from './utils/audit-log.utils'

const PAGE_SIZE = 10

const usersById = Object.fromEntries(usersMockData.map((u) => [u.id, u]))

export function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL')
  const [entityFilter, setEntityFilter] = useState<AuditEntityType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<AuditStatus | 'ALL'>('ALL')
  const [userFilter, setUserFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)

  const customRangeInvalid =
    dateFilter === 'CUSTOM' && fromDate && toDate && fromDate > toDate

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return auditLogsMockData.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false
      if (entityFilter !== 'ALL' && log.entityType !== entityFilter) return false
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false
      if (userFilter !== 'ALL' && log.userId !== userFilter) return false
      if (customRangeInvalid) return false
      if (!matchesDateFilter(log.timestamp, dateFilter, fromDate, toDate)) return false
      if (q) {
        const user = usersById[log.userId] as (typeof usersById)[string] | undefined
        const userName = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : ''
        const userCode = user ? user.userCode.toLowerCase() : ''
        const entityName = (log.entityName ?? '').toLowerCase()
        const entityId = (log.entityId ?? '').toLowerCase()
        const description = log.description.toLowerCase()
        if (
          !userName.includes(q) &&
          !userCode.includes(q) &&
          !entityName.includes(q) &&
          !entityId.includes(q) &&
          !description.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [search, actionFilter, entityFilter, statusFilter, userFilter, dateFilter, fromDate, toDate, customRangeInvalid])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const pagedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function resetPage() {
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Audit Logs</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Track important actions performed in the system.
        </p>
      </div>

      <AuditLogSummary logs={filteredLogs} />

      <AuditLogFilters
        search={search}
        actionFilter={actionFilter}
        entityFilter={entityFilter}
        statusFilter={statusFilter}
        userFilter={userFilter}
        dateFilter={dateFilter}
        fromDate={fromDate}
        toDate={toDate}
        onSearchChange={(v) => { setSearch(v); resetPage() }}
        onActionChange={(v) => { setActionFilter(v); resetPage() }}
        onEntityChange={(v) => { setEntityFilter(v); resetPage() }}
        onStatusChange={(v) => { setStatusFilter(v); resetPage() }}
        onUserChange={(v) => { setUserFilter(v); resetPage() }}
        onDateFilterChange={(v) => { setDateFilter(v); resetPage() }}
        onFromDateChange={(v) => { setFromDate(v); resetPage() }}
        onToDateChange={(v) => { setToDate(v); resetPage() }}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            {filteredLogs.length} event{filteredLogs.length !== 1 ? 's' : ''}
          </h3>
        </div>

        <AuditLogTable logs={pagedLogs} />

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 sm:flex-row">
            <p className="text-xs text-zinc-500">
              Showing{' '}
              <span className="font-medium text-zinc-700">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-zinc-700">{filteredLogs.length}</span> events
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-zinc-50"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'inline-flex h-7 min-w-7 items-center justify-center rounded border px-1.5 text-xs',
                    p === page
                      ? 'border-blue-600 bg-blue-600 font-medium text-white'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50',
                  )}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-zinc-50"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
