import { Link } from 'react-router-dom'
import type { Lead } from '../types/lead.types'
import { LEAD_SOURCE_LABELS } from '../types/lead.types'
import { LeadStatusBadge } from './LeadStatusBadge'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface LeadTableProps {
  leads: Lead[]
}

export function LeadTable({ leads }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">No leads found</p>
        <p className="mt-1 text-xs text-zinc-500">Try changing your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Lead
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Phone
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Source
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Status
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Next Follow-up
            </th>
            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-zinc-50">
              <td className="px-5 py-3">
                <Link to={`/leads/${lead.id}`} className="group flex flex-col">
                  <span className="font-medium text-zinc-900 group-hover:text-blue-600">
                    {lead.name}
                  </span>
                  <span className="font-mono text-xs text-zinc-400">{lead.leadCode}</span>
                </Link>
              </td>
              <td className="px-5 py-3 tabular-nums text-zinc-600">{lead.phone}</td>
              <td className="px-5 py-3 text-zinc-600">
                {lead.source ? (
                  LEAD_SOURCE_LABELS[lead.source]
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </td>
              <td className="px-5 py-3">
                <LeadStatusBadge status={lead.status} />
              </td>
              <td className="px-5 py-3 text-zinc-600">
                {lead.nextFollowUpDate ? (
                  formatLocalDate(lead.nextFollowUpDate)
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </td>
              <td className="px-5 py-3 text-right">
                <Link
                  to={`/leads/${lead.id}`}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
