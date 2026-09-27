import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { memberSupplementalData } from './data/member-details.mock'
import { membersMockData } from './data/members.mock'
import { ContactInformation } from './components/ContactInformation'
import { CurrentMembershipCard } from './components/CurrentMembershipCard'
import { MemberAttendanceSummary } from './components/MemberAttendanceSummary'
import { MemberHeader } from './components/MemberHeader'
import { MembershipHistory } from './components/MembershipHistory'
import { PaymentHistory } from './components/PaymentHistory'
import { PersonalInformation } from './components/PersonalInformation'
import { CurrentTrainerCard } from '../member-trainer/components/CurrentTrainerCard'
import { TrainerAssignmentHistory } from '../member-trainer/components/TrainerAssignmentHistory'
import { MemberReminderHistory } from '../notifications/components/MemberReminderHistory'

export function MemberDetailsPage() {
  const { memberId } = useParams<{ memberId: string }>()

  const member = membersMockData.find((m) => m.id === memberId)

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

  const supplemental = memberSupplementalData[member.id]
  const currentMembership = supplemental.membershipHistory[0]

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        to="/members"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Members
      </Link>

      {/* Header */}
      <MemberHeader member={member} />

      {/* 2-column info grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-5">
          <PersonalInformation member={member} />
          <ContactInformation member={member} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <CurrentMembershipCard memberId={member.id} membership={currentMembership} />

          <CurrentTrainerCard memberId={member.id} />
        </div>
      </div>

      {/* Attendance summary */}
      <MemberAttendanceSummary data={supplemental.attendanceSummary} />

      {/* Membership history */}
      <MembershipHistory history={supplemental.membershipHistory} />

      {/* Payment history */}
      <PaymentHistory payments={supplemental.paymentHistory} />

      {/* Trainer assignment history */}
      <TrainerAssignmentHistory memberId={member.id} />

      {/* Reminder history */}
      <MemberReminderHistory memberId={member.id} />
    </div>
  )
}
