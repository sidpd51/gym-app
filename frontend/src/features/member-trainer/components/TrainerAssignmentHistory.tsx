import { memberTrainerAssignmentsMockData } from '../data/member-trainer-assignments.mock'
import { trainersMockData } from '../../trainers/data/trainers.mock'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface TrainerAssignmentHistoryProps {
  memberId: string
}

export function TrainerAssignmentHistory({ memberId }: TrainerAssignmentHistoryProps) {
  const assignments = memberTrainerAssignmentsMockData.filter((a) => a.memberId === memberId)

  if (assignments.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-900">Trainer History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                Trainer
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                Start Date
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                End Date
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {assignments.map((a) => {
              const trainer = trainersMockData.find((t) => t.id === a.trainerId)
              return (
                <tr key={a.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    {trainer ? (
                      <div>
                        <p className="font-medium text-zinc-900">
                          {trainer.firstName} {trainer.lastName}
                        </p>
                        {trainer.specialization && (
                          <p className="text-xs text-zinc-400">{trainer.specialization}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400">Unknown trainer</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{formatLocalDate(a.startDate)}</td>
                  <td className="px-5 py-3 text-zinc-600">
                    {a.endDate ? formatLocalDate(a.endDate) : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {a.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                        Ended
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
