import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../hooks/useUsers'
import { UserForm } from '../components/UserForm'

export function EditUserPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user, isLoading, error, refetch } = useUser(userId)

  if (isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading user">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-100" />
        <div className="h-96 animate-pulse rounded-lg bg-zinc-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-base font-semibold text-zinc-700">Failed to load user</h2>
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">User not found</h2>
        <Link
          to="/users"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to={`/users/${user.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to User
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">
          Edit User — {user.firstName} {user.lastName}
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">{user.userCode}</p>
      </div>

      <UserForm
        mode="edit"
        userId={user.id}
        defaultValues={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone ?? '',
          role: user.role,
          status: user.status,
        }}
        onCancel={() => navigate(`/users/${user.id}`)}
        successRedirectTo={`/users/${user.id}`}
      />
    </div>
  )
}
