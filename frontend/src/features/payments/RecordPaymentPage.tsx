import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PaymentForm } from './components/PaymentForm'

export function RecordPaymentPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <Link
        to="/payments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payments
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Record Payment</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Record a new membership payment.</p>
      </div>

      <PaymentForm onCancel={() => navigate('/payments')} />
    </div>
  )
}
