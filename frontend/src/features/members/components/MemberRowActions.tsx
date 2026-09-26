import { Link } from 'react-router-dom'

interface MemberRowActionsProps {
  memberId: string
}

export function MemberRowActions({ memberId }: MemberRowActionsProps) {
  return (
    <Link
      to={`/members/${memberId}`}
      className="rounded px-3 py-1.5 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-300 hover:bg-blue-50"
    >
      View
    </Link>
  )
}
