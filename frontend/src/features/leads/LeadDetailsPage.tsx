import { useState } from 'react'
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useLead } from './hooks/useLeads'
import { useMembershipPlan } from '../membership-plans/hooks/useMembershipPlans'
import { leadRepository } from './api/leads.repository'
import { LeadStatusBadge } from './components/LeadStatusBadge'
import { LEAD_SOURCE_LABELS } from './types/lead.types'
import { ApiError } from '@/lib/api'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  )
}

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

type ConvertState = 'idle' | 'confirming' | 'converting' | 'done'

export function LeadDetailsPage() {
  const { leadId } = useParams<{ leadId: string }>()
  const { lead, isLoading, error, refetch } = useLead(leadId)
  const { plan: interestedPlan } = useMembershipPlan(lead?.interestedPlanId ?? undefined)

  const [convertState, setConvertState] = useState<ConvertState>('idle')
  const [convertError, setConvertError] = useState<string | null>(null)
  const [convertedMemberId, setConvertedMemberId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading lead">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100" />
        <div className="h-72 animate-pulse rounded-lg bg-zinc-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-base font-semibold text-zinc-700">Failed to load lead</h2>
        <p className="mt-1 text-sm text-zinc-500">{error.message}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-6 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Lead not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No lead with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{leadId}</span> exists.
        </p>
        <Link
          to="/leads"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>
      </div>
    )
  }

  const currentLead = lead
  const isAlreadyConverted = currentLead.status === 'CONVERTED'
  const isLost = currentLead.status === 'LOST'

  async function handleConfirmConvert() {
    setConvertError(null)
    setConvertState('converting')
    try {
      const memberId = await leadRepository.convert(currentLead.id, {
        firstName: currentLead.name.split(' ')[0] ?? currentLead.name,
        lastName: currentLead.name.split(' ').slice(1).join(' ') || '—',
        joiningDate: getTodayString(),
        phone: currentLead.phone,
      })
      setConvertedMemberId(memberId)
      setConvertState('done')
      refetch()
    } catch (err) {
      setConvertError(err instanceof ApiError ? err.message : 'Failed to convert lead.')
      setConvertState('idle')
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/leads"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      {convertError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
          role="alert"
        >
          {convertError}
        </div>
      )}

      {/* Header */}
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{lead.name}</h1>
            <p className="mt-0.5 font-mono text-sm text-zinc-500">{lead.leadCode}</p>
            <div className="mt-2">
              <LeadStatusBadge status={lead.status} />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/leads/${lead.id}/edit`}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Edit Lead
            </Link>
            {!isAlreadyConverted && !isLost && convertState === 'idle' && (
              <button
                type="button"
                onClick={() => setConvertState('confirming')}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Convert to Member
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conversion confirmation */}
      {convertState === 'confirming' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-amber-800">Convert Lead to Member?</h2>
              <div className="mt-2 space-y-0.5 text-sm text-amber-700">
                <p className="font-medium">{lead.name}</p>
                <p>{lead.phone}</p>
                {lead.email && <p>{lead.email}</p>}
              </div>
              <p className="mt-2 text-xs text-amber-600">
                A new member record will be created from this lead. The lead will be marked as
                converted. This action cannot be undone.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConvertState('idle')}
                  className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmConvert}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Convert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion success */}
      {convertState === 'done' && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="text-sm font-semibold text-green-800">Lead converted successfully</p>
              {convertedMemberId && (
                <Link
                  to={`/members/${convertedMemberId}`}
                  className="text-xs text-green-600 hover:underline"
                >
                  View new member →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Contact Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Contact Information</h2>
          <div className="mt-4 space-y-4">
            <DetailRow label="Phone" value={lead.phone} />
            <DetailRow
              label="Email"
              value={lead.email ?? <span className="text-zinc-400">Not provided</span>}
            />
          </div>
        </div>

        {/* Lead Information */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Lead Information</h2>
          <div className="mt-4 space-y-4">
            <DetailRow
              label="Source"
              value={
                lead.source ? (
                  LEAD_SOURCE_LABELS[lead.source]
                ) : (
                  <span className="text-zinc-400">Not specified</span>
                )
              }
            />
            <DetailRow
              label="Interested Plan"
              value={
                interestedPlan ? (
                  `${interestedPlan.name} — ₹${interestedPlan.price.toLocaleString('en-IN')}`
                ) : (
                  <span className="text-zinc-400">Not specified</span>
                )
              }
            />
            <DetailRow label="Created" value={formatLocalDate(lead.createdAt)} />
          </div>
        </div>

        {/* Follow-up */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-900">Follow-up</h2>
          <div className="mt-4 space-y-4">
            <DetailRow
              label="Last Follow-up"
              value={
                lead.lastFollowUpDate ? (
                  formatLocalDate(lead.lastFollowUpDate)
                ) : (
                  <span className="text-zinc-400">—</span>
                )
              }
            />
            <DetailRow
              label="Next Follow-up"
              value={
                lead.nextFollowUpDate ? (
                  formatLocalDate(lead.nextFollowUpDate)
                ) : (
                  <span className="text-zinc-400">—</span>
                )
              }
            />
          </div>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
            <h2 className="text-sm font-semibold text-zinc-900">Notes</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{lead.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
