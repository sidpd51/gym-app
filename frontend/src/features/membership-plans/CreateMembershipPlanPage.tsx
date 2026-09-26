import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { MembershipPlanForm } from './components/MembershipPlanForm'

export function CreateMembershipPlanPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <Link
        to="/membership-plans"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Plans
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Create Membership Plan</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Define a new plan to offer to gym members.</p>
      </div>

      <MembershipPlanForm mode="create" onCancel={() => navigate('/membership-plans')} />
    </div>
  )
}
