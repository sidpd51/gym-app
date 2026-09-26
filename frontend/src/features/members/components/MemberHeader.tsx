import type { Member } from '../types/member.types'
import { MemberAvatar } from './MemberAvatar'
import { MemberStatusBadge } from './MemberStatusBadge'

interface MemberHeaderProps {
  member: Member
}

export function MemberHeader({ member }: MemberHeaderProps) {
  const joinedFormatted = new Date(member.joiningDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <MemberAvatar firstName={member.firstName} lastName={member.lastName} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              {member.firstName} {member.lastName}
            </h1>
            <p className="mt-0.5 font-mono text-sm text-zinc-500">{member.memberCode}</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xs text-zinc-400">Joined {joinedFormatted}</span>
              <MemberStatusBadge status={member.status} />
            </div>
          </div>
        </div>

        {/* Action buttons — reserved for future phases */}
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            disabled
            title="Member editing will be available in a future phase"
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-400 disabled:cursor-not-allowed"
          >
            Edit Member
          </button>
          <button
            disabled
            title="Membership renewal will be available in a future phase"
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-400 disabled:cursor-not-allowed"
          >
            Renew Membership
          </button>
          <button
            disabled
            title="Check-in will be available in a future phase"
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-400 disabled:cursor-not-allowed"
          >
            Check In
          </button>
        </div>
      </div>
    </div>
  )
}
