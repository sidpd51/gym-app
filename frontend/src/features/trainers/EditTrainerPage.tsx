import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTrainer } from './hooks/useTrainers'
import { TrainerForm } from './components/TrainerForm'

export function EditTrainerPage() {
  const { trainerId } = useParams<{ trainerId: string }>()
  const navigate = useNavigate()

  const { trainer, isLoading, error, refetch } = useTrainer(trainerId)

  if (isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading trainer">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-100" />
        <div className="h-96 animate-pulse rounded-lg bg-zinc-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-base font-semibold text-zinc-700">Failed to load trainer</h2>
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

  if (!trainer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Trainer not found</h2>
        <Link
          to="/trainers"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trainers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to={`/trainers/${trainer.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trainer
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Edit Trainer</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Update the details for{' '}
          <span className="font-medium text-zinc-700">
            {trainer.firstName} {trainer.lastName}
          </span>
          .
        </p>
      </div>

      <TrainerForm
        mode="edit"
        trainerId={trainer.id}
        defaultValues={{
          firstName: trainer.firstName,
          lastName: trainer.lastName,
          phone: trainer.phone,
          email: trainer.email ?? '',
          specialization: trainer.specialization ?? '',
          joiningDate: trainer.joiningDate,
        }}
        onCancel={() => navigate(`/trainers/${trainer.id}`)}
        successRedirectTo={`/trainers/${trainer.id}`}
      />
    </div>
  )
}
