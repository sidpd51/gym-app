import { useState } from 'react'
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { membershipPlansMockData } from '../membership-plans/data/membership-plans.mock'
import { leadsMockData } from './data/leads.mock'
import { LeadStatusBadge } from './components/LeadStatusBadge'
import { LEAD_SOURCE_LABELS } from './types/lead.types'
import type { LeadStatus } from './types/lead.types'

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

type ConvertState = 'idle' | 'confirming' | 'done'

export function LeadDetailsPage() {
  const { leadId } = useParams<{ leadId: string }>()
  const lead = leadsMockData.find((l) => l.id === leadId)

  const [convertState, setConvertState] = useState<ConvertState>('idle')
  const [statusOverride, setStatusOverride] = useState<LeadStatus | null>(null)

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

  const effectiveStatus = statusOverride ?? lead.status
  const interestedPlan = lead.interestedPlanId
    ? membershipPlansMockData.find((p) => p.id === lead.interestedPlanId)
    : null

  const isAlreadyConverted = effectiveStatus === 'CONVERTED'
  const isLost = effectiveStatus === 'LOST'

  function handleConfirmConvert() {
    setStatusOverride('CONVERTED')
    setConvertState('done')
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

      {/* Header */}
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{lead.name}</h1>
            <p className="mt-0.5 font-mono text-sm text-zinc-500">{lead.leadCode}</p>
            <div className="mt-2">
              <LeadStatusBadge status={effectiveStatus} />
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
                The lead information will be used to create a member. This is a mock operation —
                no persistent changes will be made.
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
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
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
              <p className="text-xs text-green-600">
                Member creation will be connected to the real backend later. Changes have not been
                persisted.
              </p>
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
