import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { TrainerForm } from './components/TrainerForm'

export function CreateTrainerPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <Link
        to="/trainers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trainers
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Add Trainer</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Add a new trainer to the gym's staff.
        </p>
      </div>

      <TrainerForm mode="create" onCancel={() => navigate('/trainers')} />
    </div>
  )
}
