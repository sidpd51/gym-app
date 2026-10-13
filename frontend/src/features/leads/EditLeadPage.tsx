import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLead } from './hooks/useLeads'
import { LeadForm } from './components/LeadForm'

export function EditLeadPage() {
  const { leadId } = useParams<{ leadId: string }>()
  const navigate = useNavigate()

  const { lead, isLoading, error, refetch } = useLead(leadId)

  if (isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading lead">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-100" />
        <div className="h-96 animate-pulse rounded-lg bg-zinc-100" />
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

  return (
    <div className="space-y-5">
      <Link
        to={`/leads/${lead.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Lead
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Edit Lead</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Update the details for{' '}
          <span className="font-medium text-zinc-700">{lead.name}</span>.
        </p>
      </div>

      <LeadForm
        mode="edit"
        leadId={lead.id}
        defaultValues={{
          name: lead.name,
          phone: lead.phone,
          email: lead.email ?? '',
          source: lead.source ?? '',
          interestedPlanId: lead.interestedPlanId ?? '',
          nextFollowUpDate: lead.nextFollowUpDate ?? '',
          notes: lead.notes ?? '',
        }}
        onCancel={() => navigate(`/leads/${lead.id}`)}
        successRedirectTo={`/leads/${lead.id}`}
      />
    </div>
  )
}
