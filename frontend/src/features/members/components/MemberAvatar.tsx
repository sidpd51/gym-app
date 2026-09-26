const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
]

function getColorClass(name: string): string {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

interface MemberAvatarProps {
  firstName: string
  lastName: string
  size?: 'sm' | 'lg'
}

export function MemberAvatar({ firstName, lastName, size = 'sm' }: MemberAvatarProps) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase()
  const colorClass = getColorClass(firstName + lastName)
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-lg' : 'h-8 w-8 text-xs'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${colorClass} ${sizeClass}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
