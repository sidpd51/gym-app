import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50">
      <p className="text-5xl font-bold text-zinc-300">404</p>
      <h1 className="text-xl font-semibold text-zinc-800">Page not found</h1>
      <p className="text-sm text-zinc-500">The page you are looking for does not exist.</p>
      <Link
        to="/dashboard"
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
