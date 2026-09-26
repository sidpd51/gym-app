import type { Member } from '../types/member.types'

interface PersonalInformationProps {
  member: Member
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2.5">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="text-right text-sm text-zinc-900">{value ?? <span className="text-zinc-400">Not provided</span>}</dd>
    </div>
  )
}

function formatDob(dob: string): string {
  return new Date(dob).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function PersonalInformation({ member }: PersonalInformationProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <h3 className="text-sm font-semibold text-zinc-900">Personal Information</h3>
      <dl className="mt-3 divide-y divide-zinc-100">
        <InfoRow label="First Name" value={member.firstName} />
        <InfoRow label="Last Name" value={member.lastName} />
        <InfoRow
          label="Date of Birth"
          value={member.dateOfBirth ? formatDob(member.dateOfBirth) : undefined}
        />
        <InfoRow label="Gender" value={member.gender} />
      </dl>
    </div>
  )
}
