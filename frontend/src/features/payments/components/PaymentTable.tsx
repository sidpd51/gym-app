import { Link } from 'react-router-dom'
import type { Member } from '../../members/types/member.types'
import { PAYMENT_METHOD_LABELS } from '../types/payment.types'
import type { Payment } from '../types/payment.types'
import { PaymentStatusBadge } from './PaymentStatusBadge'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface PaymentTableProps {
  payments: Payment[]
  membersById: Record<string, Member>
}

export function PaymentTable({ payments, membersById }: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">No payments found</p>
        <p className="mt-1 text-sm text-zinc-500">Try changing your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Receipt</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Member</th>
            <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Amount</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Method</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Date</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
            <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {payments.map((payment) => {
            const member = membersById[payment.memberId] as Member | undefined
            return (
              <tr key={payment.id} className="hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <Link
                    to={`/payments/${payment.id}`}
                    className="font-mono text-xs font-medium text-blue-600 hover:underline"
                  >
                    {payment.id}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  {member ? (
                    <Link to={`/members/${member.id}`} className="group flex flex-col">
                      <span className="font-medium text-zinc-900 group-hover:text-blue-600">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className="text-xs text-zinc-400">{member.memberCode}</span>
                    </Link>
                  ) : (
                    <span className="text-zinc-400">Unknown member</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-zinc-900">
                  ₹{payment.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                </td>
                <td className="px-5 py-3 text-zinc-600">{formatLocalDate(payment.paymentDate)}</td>
                <td className="px-5 py-3">
                  <PaymentStatusBadge status={payment.status} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    to={`/payments/${payment.id}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
