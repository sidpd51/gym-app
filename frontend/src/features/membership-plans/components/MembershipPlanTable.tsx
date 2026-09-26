import { Link } from 'react-router-dom'
import type { MembershipPlan, MembershipPlanStatus } from '../types/membership-plan.types'
import { MembershipPlanStatusBadge } from './MembershipPlanStatusBadge'

function formatDuration(days: number): string {
  if (days === 365) return '1 year'
  if (days === 730) return '2 years'
  if (days % 30 === 0) {
    const months = days / 30
    return `${months} month${months > 1 ? 's' : ''}`
  }
  return `${days} days`
}

function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

interface MembershipPlanTableProps {
  plans: MembershipPlan[]
  effectiveStatus: (planId: string) => MembershipPlanStatus
  onToggleStatus: (planId: string, current: MembershipPlanStatus) => void
}

export function MembershipPlanTable({
  plans,
  effectiveStatus,
  onToggleStatus,
}: MembershipPlanTableProps) {
  if (plans.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">No membership plans found.</p>
        <p className="mt-1 text-xs text-zinc-500">Try changing your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left">
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Plan</th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Duration</th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Price</th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Status</th>
            <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => {
            const status = effectiveStatus(plan.id)
            const isActive = status === 'ACTIVE'
            return (
              <tr key={plan.id} className="border-b border-zinc-50 last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-zinc-900">{plan.name}</p>
                  {plan.description && (
                    <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-500">
                      {plan.description}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3 text-zinc-600">{formatDuration(plan.durationInDays)}</td>
                <td className="px-5 py-3 font-medium tabular-nums text-zinc-900">
                  {formatPrice(plan.price)}
                </td>
                <td className="px-5 py-3">
                  <MembershipPlanStatusBadge status={status} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/membership-plans/${plan.id}/edit`}
                      className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onToggleStatus(plan.id, status)}
                      className={
                        isActive
                          ? 'rounded px-2.5 py-1 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-300 hover:bg-amber-50'
                          : 'rounded px-2.5 py-1 text-xs font-medium text-green-600 ring-1 ring-inset ring-green-300 hover:bg-green-50'
                      }
                      aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${plan.name}`}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
