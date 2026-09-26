import { Link } from 'react-router-dom'
import { memberTrainerAssignmentsMockData } from '../data/member-trainer-assignments.mock'
import { trainersMockData } from '../../trainers/data/trainers.mock'
import { TrainerAvatar } from '../../trainers/components/TrainerAvatar'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface CurrentTrainerCardProps {
  memberId: string
}

export function CurrentTrainerCard({ memberId }: CurrentTrainerCardProps) {
  const assignment = memberTrainerAssignmentsMockData.find(
    (a) => a.memberId === memberId && a.status === 'ACTIVE',
  )
  const trainer = assignment
    ? (trainersMockData.find((t) => t.id === assignment.trainerId) ?? null)
    : null

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">Trainer</h3>
        <Link
          to={`/members/${memberId}/trainer/assign`}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          {trainer ? 'Change Trainer' : 'Assign Trainer'}
        </Link>
      </div>

      {trainer && assignment ? (
        <div className="mt-3 flex items-center gap-3">
          <TrainerAvatar firstName={trainer.firstName} lastName={trainer.lastName} />
          <div>
            <p className="font-medium text-zinc-900">
              {trainer.firstName} {trainer.lastName}
            </p>
            {trainer.specialization && (
              <p className="text-xs text-zinc-500">{trainer.specialization}</p>
            )}
            <p className="mt-0.5 text-xs text-zinc-400">
              Assigned since {formatLocalDate(assignment.startDate)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">No trainer assigned.</p>
      )}
    </div>
  )
}
