import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMember } from '../members/hooks/useMembers'
import { MembershipForm } from './components/MembershipForm'

export function CreateMembershipPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()

  const { member, supplementalData } = useMember(memberId)

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Member not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No member with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{memberId}</span> exists.
        </p>
        <Link
          to="/members"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Link>
      </div>
    )
  }

  const hasActiveMembership = supplementalData?.membershipHistory[0]?.status === 'ACTIVE'

  if (hasActiveMembership) {
    return (
      <div className="space-y-5">
        <Link
          to={`/members/${member.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Member
        </Link>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center">
          <h2 className="text-base font-semibold text-amber-800">Active Membership Exists</h2>
          <p className="mt-1 text-sm text-amber-700">
            {member.firstName} {member.lastName} already has an active membership.
          </p>
          <Link
            to={`/members/${member.id}`}
            className="mt-5 inline-block rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            View Member
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to={`/members/${member.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Member
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">New Membership</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Creating membership for{' '}
          <span className="font-medium text-zinc-700">
            {member.firstName} {member.lastName}
          </span>
          .
        </p>
      </div>

      <MembershipForm
        memberId={member.id}
        onCancel={() => navigate(`/members/${member.id}`)}
      />
    </div>
  )
}
