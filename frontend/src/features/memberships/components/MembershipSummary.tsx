interface MembershipSummaryProps {
  planName: string
  durationInDays: number
  startDate: string
  endDate: string
  amount: number
}

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function MembershipSummary({ planName, durationInDays, startDate, endDate, amount }: MembershipSummaryProps) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 px-6 py-5">
      <h2 className="text-sm font-semibold text-blue-900">Membership Summary</h2>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">Plan</span>
          <span className="font-medium text-zinc-900">{planName}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">Duration</span>
          <span className="font-medium text-zinc-900">{durationInDays} days</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">Start Date</span>
          <span className="font-medium text-zinc-900">{formatLocalDate(startDate)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">End Date</span>
          <span className="font-medium text-zinc-900">{formatLocalDate(endDate)}</span>
        </div>
        <div className="border-t border-blue-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900">Total Amount</span>
            <span className="text-lg font-bold tabular-nums text-zinc-900">
              ₹{amount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
