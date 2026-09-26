import { Link } from 'react-router-dom'
import type { MembershipHistoryItem } from '../types/member.types'
import { MemberStatusBadge } from './MemberStatusBadge'

interface CurrentMembershipCardProps {
  memberId: string
  membership: MembershipHistoryItem | undefined
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function CurrentMembershipCard({ memberId, membership }: CurrentMembershipCardProps) {
  const showCreateLink = membership?.status !== 'ACTIVE'

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Current Membership</h3>
        {showCreateLink && (
          <Link
            to={`/members/${memberId}/membership/new`}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            + Create Membership
          </Link>
        )}
      </div>

      {membership ? (
        <div className="mt-4 space-y-3">
          <p className="text-base font-semibold text-zinc-900">{membership.plan} Plan</p>

          <div className="flex items-center gap-1.5 text-sm text-zinc-600">
            <span>{formatDate(membership.startDate)}</span>
            <span className="text-zinc-300">→</span>
            <span>{formatDate(membership.endDate)}</span>
          </div>

          <p className="text-xl font-bold tabular-nums text-zinc-900">
            ₹{membership.amount.toLocaleString('en-IN')}
          </p>

          <MemberStatusBadge status={membership.status} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">No active membership</p>
      )}
    </div>
  )
}
