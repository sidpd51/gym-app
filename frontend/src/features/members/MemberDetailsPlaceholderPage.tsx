import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

export function MemberDetailsPlaceholderPage() {
  const { memberId } = useParams<{ memberId: string }>()

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-4xl font-bold text-zinc-200">Coming Soon</p>
      <p className="mt-3 text-sm text-zinc-500">
        Member details for <span className="font-mono font-medium text-zinc-700">{memberId}</span>{' '}
        will be implemented in the next phase.
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
