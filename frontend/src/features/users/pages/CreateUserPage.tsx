import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { UserForm } from '../components/UserForm'

export function CreateUserPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Add User</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Create a new application user account.</p>
      </div>

      <UserForm mode="create" onCancel={() => navigate('/users')} />
    </div>
  )
}
