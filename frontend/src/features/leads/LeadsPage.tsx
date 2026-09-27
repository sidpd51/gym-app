import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { leadsMockData } from './data/leads.mock'
import { LeadFilters } from './components/LeadFilters'
import { LeadTable } from './components/LeadTable'
import type { LeadSource, LeadStatus } from './types/lead.types'
import { PermissionGate } from '@/features/auth/components/PermissionGate'

export function LeadsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL')
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'ALL'>('ALL')

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leadsMockData.filter((l) => {
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false
      if (sourceFilter !== 'ALL' && l.source !== sourceFilter) return false
      if (q) {
        const name = l.name.toLowerCase()
        const phone = l.phone
        const email = (l.email ?? '').toLowerCase()
        const code = l.leadCode.toLowerCase()
        if (!name.includes(q) && !phone.includes(q) && !email.includes(q) && !code.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [search, statusFilter, sourceFilter])

  function handleSearchChange(value: string) {
    setSearch(value)
  }

  function handleStatusChange(value: LeadStatus | 'ALL') {
    setStatusFilter(value)
  }

  function handleSourceChange(value: LeadSource | 'ALL') {
    setSourceFilter(value)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Leads</h2>
          <p className="mt-0.5 text-sm text-zinc-500">Manage enquiries and follow-ups.</p>
        </div>
        <PermissionGate permission="leads:create">
          <Link
            to="/leads/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Lead
          </Link>
        </PermissionGate>
      </div>

      <LeadFilters
        search={search}
        statusFilter={statusFilter}
        sourceFilter={sourceFilter}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onSourceChange={handleSourceChange}
      />

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
          </h3>
        </div>
        <LeadTable leads={filteredLeads} />
      </div>
    </div>
  )
}
