import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { MemberForm } from './components/MemberForm'

export function CreateMemberPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        to="/members"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Members
      </Link>

      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Create Member</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Add a new member to the gym.</p>
      </div>

      {/* Form */}
      <MemberForm onCancel={() => navigate('/members')} />
    </div>
  )
}
