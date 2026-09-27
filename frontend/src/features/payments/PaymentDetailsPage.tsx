import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useMembers } from '../members/hooks/useMembers'
import { useMemberships } from '../memberships/hooks/useMemberships'
import { PaymentStatusBadge } from './components/PaymentStatusBadge'
import { usePayment } from './hooks/usePayments'
import { PAYMENT_METHOD_LABELS } from './types/payment.types'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

export function PaymentDetailsPage() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const { payment } = usePayment(paymentId)
  const { members } = useMembers()
  const { memberships } = useMemberships()

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Payment not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No payment with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{paymentId}</span> exists.
        </p>
        <Link
          to="/payments"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>
      </div>
    )
  }

  const member = members.find((m) => m.id === payment.memberId)
  const membership = payment.membershipId
    ? memberships.find((ms) => ms.id === payment.membershipId)
    : null

  return (
    <div className="space-y-5">
      <Link
        to="/payments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payments
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900">Payment Details</h1>

      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        {/* Receipt header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-lg font-semibold text-zinc-900">{payment.id}</span>
          <PaymentStatusBadge status={payment.status} />
        </div>

        <div className="mt-4 divide-y divide-zinc-100">
          {/* Member */}
          <DetailSection label="Member">
            {member ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-zinc-900">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-zinc-400">{member.memberCode}</p>
                </div>
                <Link
                  to={`/members/${member.id}`}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  View Member
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Unknown member</p>
            )}
          </DetailSection>

          {/* Membership */}
          {membership && (
            <DetailSection label="Membership">
              <p className="font-medium text-zinc-900">{membership.planName}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {formatLocalDate(membership.startDate)} → {formatLocalDate(membership.endDate)}
              </p>
            </DetailSection>
          )}

          {/* Amount */}
          <DetailSection label="Amount">
            <p className="text-2xl font-bold tabular-nums text-zinc-900">
              ₹{payment.amount.toLocaleString('en-IN')}
            </p>
          </DetailSection>

          {/* Method */}
          <DetailSection label="Payment Method">
            <p className="font-medium text-zinc-900">
              {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
            </p>
          </DetailSection>

          {/* Date */}
          <DetailSection label="Payment Date">
            <p className="font-medium text-zinc-900">{formatLocalDate(payment.paymentDate)}</p>
          </DetailSection>

          {/* Reference */}
          <DetailSection label="Reference">
            <p className="font-medium text-zinc-900">{payment.reference ?? '—'}</p>
          </DetailSection>

          {/* Notes */}
          <DetailSection label="Notes">
            <p className="font-medium text-zinc-900">{payment.notes ?? '—'}</p>
          </DetailSection>
        </div>
      </div>
    </div>
  )
}
