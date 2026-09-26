import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { LeadForm } from './components/LeadForm'

export function CreateLeadPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <Link
        to="/leads"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Add Lead</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Record a new enquiry or walk-in lead.
        </p>
      </div>

      <LeadForm mode="create" onCancel={() => navigate('/leads')} />
    </div>
  )
}
