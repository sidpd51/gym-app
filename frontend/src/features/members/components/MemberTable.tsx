import type { Member } from '../types/member.types'
import { MemberAvatar } from './MemberAvatar'
import { MemberRowActions } from './MemberRowActions'
import { MemberStatusBadge } from './MemberStatusBadge'

interface MemberTableProps {
  members: Member[]
}

export function MemberTable({ members }: MemberTableProps) {
  if (members.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-zinc-500">
        No members match your filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left">
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Member
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Code
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Phone
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Plan
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Expires
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Trainer
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              Status
            </th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-zinc-50 last:border-0">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <MemberAvatar firstName={member.firstName} lastName={member.lastName} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {member.firstName} {member.lastName}
                    </p>
                    {member.email && (
                      <p className="truncate text-xs text-zinc-500">{member.email}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 font-mono text-xs text-zinc-500">{member.memberCode}</td>
              <td className="px-5 py-3 tabular-nums text-zinc-600">{member.phone}</td>
              <td className="px-5 py-3 text-zinc-600">{member.membershipPlan ?? '—'}</td>
              <td className="px-5 py-3 tabular-nums text-zinc-600">
                {member.membershipEndDate ?? '—'}
              </td>
              <td className="px-5 py-3 text-zinc-600">{member.trainerName ?? '—'}</td>
              <td className="px-5 py-3">
                <MemberStatusBadge status={member.status} />
              </td>
              <td className="px-5 py-3">
                <MemberRowActions memberId={member.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
