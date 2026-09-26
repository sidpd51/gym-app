import { Link } from 'react-router-dom'
import type { Trainer, TrainerStatus } from '../types/trainer.types'
import { TrainerAvatar } from './TrainerAvatar'
import { TrainerStatusBadge } from './TrainerStatusBadge'

interface TrainerTableProps {
  trainers: Trainer[]
  effectiveStatus: (trainerId: string) => TrainerStatus
  onToggleStatus: (trainerId: string, current: TrainerStatus) => void
}

export function TrainerTable({ trainers, effectiveStatus, onToggleStatus }: TrainerTableProps) {
  if (trainers.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">No trainers found</p>
        <p className="mt-1 text-xs text-zinc-500">Try changing your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Trainer
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Code
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Specialization
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Phone
            </th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-zinc-500">
              Status
            </th>
            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-zinc-500">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {trainers.map((trainer) => {
            const status = effectiveStatus(trainer.id)
            const isActive = status === 'ACTIVE'
            return (
              <tr key={trainer.id} className="hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <Link to={`/trainers/${trainer.id}`} className="group flex items-center gap-3">
                    <TrainerAvatar firstName={trainer.firstName} lastName={trainer.lastName} />
                    <div>
                      <p className="font-medium text-zinc-900 group-hover:text-blue-600">
                        {trainer.firstName} {trainer.lastName}
                      </p>
                      {trainer.email && (
                        <p className="text-xs text-zinc-400">{trainer.email}</p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-zinc-600">
                  {trainer.trainerCode}
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  {trainer.specialization ?? <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-5 py-3 tabular-nums text-zinc-600">{trainer.phone}</td>
                <td className="px-5 py-3">
                  <TrainerStatusBadge status={status} />
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/trainers/${trainer.id}/edit`}
                      className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onToggleStatus(trainer.id, status)}
                      className={
                        isActive
                          ? 'rounded px-2.5 py-1 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-300 hover:bg-amber-50'
                          : 'rounded px-2.5 py-1 text-xs font-medium text-green-600 ring-1 ring-inset ring-green-300 hover:bg-green-50'
                      }
                      aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${trainer.firstName} ${trainer.lastName}`}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
