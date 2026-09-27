import { ShieldOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldOff size={40} className="text-zinc-300" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-zinc-800">Access Restricted</h2>
      <p className="mt-1.5 text-sm text-zinc-500">
        You don't have permission to access this page. Contact your administrator if you need access.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Go Back
        </button>
        <Link
          to="/dashboard"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
