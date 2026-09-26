import type { ExpiringMembership } from '../types/dashboard.types'
import { cn } from '@/lib/utils'

interface ExpiringMembershipsProps {
  data: ExpiringMembership[]
}

function ExpiryBadge({ expiresIn, label }: { expiresIn: number; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        expiresIn <= 1 && 'bg-red-50 text-red-700',
        expiresIn > 1 && expiresIn <= 3 && 'bg-amber-50 text-amber-700',
        expiresIn > 3 && 'bg-zinc-100 text-zinc-600'
      )}
    >
      {label}
    </span>
  )
}

export function ExpiringMemberships({ data }: ExpiringMembershipsProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-900">Memberships Expiring Soon</h3>
        <p className="mt-0.5 text-xs text-zinc-500">Within the next 7 days</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left">
              <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
                Member
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
                Plan
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
                Expires
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-zinc-50 last:border-0">
                <td className="px-5 py-3 font-medium text-zinc-900">{item.memberName}</td>
                <td className="px-5 py-3 text-zinc-600">{item.plan}</td>
                <td className="px-5 py-3">
                  <ExpiryBadge expiresIn={item.expiresIn} label={item.expiryLabel} />
                </td>
                <td className="px-5 py-3">
                  <button
                    disabled
                    title="Renewal will be available in a later phase"
                    aria-label={`Renew membership for ${item.memberName} (not yet available)`}
                    className="rounded px-3 py-1.5 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Renew
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
