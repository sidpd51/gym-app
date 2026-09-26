import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { membershipPlansMockData } from './data/membership-plans.mock'
import { MembershipPlanForm } from './components/MembershipPlanForm'

export function EditMembershipPlanPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()

  const plan = membershipPlansMockData.find((p) => p.id === planId)

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Membership plan not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No plan with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{planId}</span> exists.
        </p>
        <Link
          to="/membership-plans"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Membership Plans
        </Link>
      </div>
    )
  }

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
        <h1 className="text-xl font-semibold text-zinc-900">Edit Membership Plan</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Update the details for <span className="font-medium text-zinc-700">{plan.name}</span>.
        </p>
      </div>

      <MembershipPlanForm
        mode="edit"
        defaultValues={{
          name: plan.name,
          description: plan.description ?? '',
          durationInDays: String(plan.durationInDays),
          price: String(plan.price),
        }}
        onCancel={() => navigate('/membership-plans')}
      />
    </div>
  )
}
