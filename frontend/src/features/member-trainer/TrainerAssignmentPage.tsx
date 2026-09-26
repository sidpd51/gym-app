import { useState } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { membersMockData } from '../members/data/members.mock'
import { trainersMockData } from '../trainers/data/trainers.mock'
import { memberTrainerAssignmentsMockData } from './data/member-trainer-assignments.mock'
import { TrainerAssignmentForm } from './components/TrainerAssignmentForm'
import { TrainerAvatar } from '../trainers/components/TrainerAvatar'
import type { MemberTrainerAssignment, AssignmentStatus } from './types/member-trainer.types'
import type { AssignTrainerFormValues } from './schemas/member-trainer.schema'

function formatLocalDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function TrainerAssignmentPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()

  const member = membersMockData.find((m) => m.id === memberId)

  const [assignments, setAssignments] = useState<MemberTrainerAssignment[]>(
    () => memberTrainerAssignmentsMockData.filter((a) => a.memberId === memberId),
  )

  const [submittedData, setSubmittedData] = useState<{
    trainerId: string
    wasChange: boolean
  } | null>(null)

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl font-bold text-zinc-200">Not Found</p>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">Member not found</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No member with ID{' '}
          <span className="font-mono font-medium text-zinc-700">{memberId}</span> exists.
        </p>
        <Link
          to="/members"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Link>
      </div>
    )
  }

  const activeAssignment = assignments.find((a) => a.status === 'ACTIVE')
  const activeTrainer = activeAssignment
    ? (trainersMockData.find((t) => t.id === activeAssignment.trainerId) ?? null)
    : null

  function handleSubmit(data: AssignTrainerFormValues) {
    if (!member) return
    const wasChange = !!activeAssignment

    setAssignments((prev) => {
      const ended = prev.map((a) =>
        a.status === 'ACTIVE'
          ? ({ ...a, status: 'ENDED' as AssignmentStatus, endDate: data.startDate })
          : a,
      )
      return [
        ...ended,
        {
          id: `MTA-NEW-${Date.now()}`,
          memberId: member.id,
          trainerId: data.trainerId,
          startDate: data.startDate,
          status: 'ACTIVE' as AssignmentStatus,
        },
      ]
    })

    setSubmittedData({ trainerId: data.trainerId, wasChange })
  }

  // Success state
  if (submittedData) {
    const newTrainer = trainersMockData.find((t) => t.id === submittedData.trainerId)
    return (
      <div className="space-y-5">
        <Link
          to={`/members/${member.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {member.firstName} {member.lastName}
        </Link>

        <div className="rounded-lg border border-green-200 bg-green-50 px-6 py-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-green-800">
            {submittedData.wasChange ? 'Trainer changed successfully' : 'Trainer assigned successfully'}
          </h3>
          {newTrainer && (
            <p className="mt-1 text-sm text-green-700">
              {member.firstName} {member.lastName} is now assigned to{' '}
              <span className="font-medium">
                {newTrainer.firstName} {newTrainer.lastName}
              </span>
              .
            </p>
          )}
          <p className="mt-1 text-xs text-green-600">
            Backend integration will be added in a later phase. Changes have not been persisted.
          </p>
          <Link
            to={`/members/${member.id}`}
            className="mt-5 inline-flex items-center rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Back to Member
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Link
        to={`/members/${member.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {member.firstName} {member.lastName}
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Trainer Assignment</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          {activeTrainer ? 'Change' : 'Assign'} a trainer for this member.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left — member + current trainer */}
        <div className="space-y-5">
          {/* Member card */}
          <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Member</p>
            <p className="mt-1.5 text-base font-semibold text-zinc-900">
              {member.firstName} {member.lastName}
            </p>
            <p className="font-mono text-sm text-zinc-500">{member.memberCode}</p>
          </div>

          {/* Current trainer */}
          <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Current Trainer
            </p>
            {activeTrainer && activeAssignment ? (
              <div className="mt-3 flex items-center gap-3">
                <TrainerAvatar
                  firstName={activeTrainer.firstName}
                  lastName={activeTrainer.lastName}
                />
                <div>
                  <p className="font-medium text-zinc-900">
                    {activeTrainer.firstName} {activeTrainer.lastName}
                  </p>
                  {activeTrainer.specialization && (
                    <p className="text-xs text-zinc-500">{activeTrainer.specialization}</p>
                  )}
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Assigned since {formatLocalDate(activeAssignment.startDate)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">No trainer is currently assigned.</p>
            )}
          </div>
        </div>

        {/* Right — form */}
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">
            {activeTrainer ? 'Change Trainer' : 'Assign Trainer'}
          </h2>
          <TrainerAssignmentForm
            activeTrainerId={activeAssignment?.trainerId ?? null}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/members/${member.id}`)}
          />
        </div>
      </div>
    </div>
  )
}
