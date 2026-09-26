import type { MemberPaymentRecord } from '../types/member.types'

interface PaymentHistoryProps {
  payments: MemberPaymentRecord[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-900">Payment History</h3>
      </div>

      {payments.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500">No payment records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left">
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Receipt</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Plan</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Amount</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Method</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.receiptId} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-3 font-mono text-xs text-zinc-500">{p.receiptId}</td>
                  <td className="px-5 py-3 text-zinc-600">{p.plan}</td>
                  <td className="px-5 py-3 font-medium tabular-nums text-zinc-900">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      {p.method}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-zinc-500">{formatDate(p.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
