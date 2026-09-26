import type { MembershipHistoryItem } from '../types/member.types'
import { MemberStatusBadge } from './MemberStatusBadge'

interface MembershipHistoryProps {
  history: MembershipHistoryItem[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function MembershipHistory({ history }: MembershipHistoryProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-900">Membership History</h3>
      </div>

      {history.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">No membership records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left">
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Plan</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Start</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">End</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Amount</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-zinc-900">{item.plan}</td>
                  <td className="px-5 py-3 tabular-nums text-zinc-600">{formatDate(item.startDate)}</td>
                  <td className="px-5 py-3 tabular-nums text-zinc-600">{formatDate(item.endDate)}</td>
                  <td className="px-5 py-3 tabular-nums text-zinc-900">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3">
                    <MemberStatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
