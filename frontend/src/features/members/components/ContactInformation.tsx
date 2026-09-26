import type { Member } from '../types/member.types'

interface ContactInformationProps {
  member: Member
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2.5">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="text-right text-sm text-zinc-900 break-words">
        {value ?? <span className="text-zinc-400">Not provided</span>}
      </dd>
    </div>
  )
}

export function ContactInformation({ member }: ContactInformationProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <h3 className="text-sm font-semibold text-zinc-900">Contact Information</h3>
      <dl className="mt-3 divide-y divide-zinc-100">
        <InfoRow label="Phone" value={member.phone} />
        <InfoRow label="Email" value={member.email} />
        <InfoRow label="Address" value={member.address} />
        <InfoRow label="Emergency Contact" value={member.emergencyContact} />
      </dl>
    </div>
  )
}
