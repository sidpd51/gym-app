import type { RecentPayment } from '../types/dashboard.types'

interface RecentPaymentsProps {
  data: RecentPayment[]
}

function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function RecentPayments({ data }: RecentPaymentsProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-900">Recent Payments</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left">
              <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
                Receipt
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
                Member
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
                Amount
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
                Method
              </th>
              <th scope="col" className="px-5 py-3 text-xs font-medium text-zinc-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((payment) => (
              <tr key={payment.receiptId} className="border-b border-zinc-50 last:border-0">
                <td className="px-5 py-3 font-mono text-xs text-zinc-500">
                  {payment.receiptId}
                </td>
                <td className="px-5 py-3 font-medium text-zinc-900">{payment.memberName}</td>
                <td className="px-5 py-3 font-medium tabular-nums text-zinc-900">
                  {formatAmount(payment.amount)}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {payment.method}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-500">{payment.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
