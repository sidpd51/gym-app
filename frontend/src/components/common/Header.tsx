import { Bell, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/members': 'Members',
  '/memberships': 'Memberships',
  '/membership-plans': 'Membership Plans',
  '/attendance': 'Attendance',
  '/payments': 'Payments',
  '/trainers': 'Trainers',
  '/leads': 'Leads',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? 'Gym Management System'
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()
  const title = getPageTitle(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4">
      {/* Hamburger — mobile only */}
      <button
        className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <h1 className="flex-1 text-base font-semibold text-zinc-900">{title}</h1>

      <div className="flex items-center gap-1">
        {/* Notification placeholder */}
        <button
          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* User profile placeholder */}
        <div
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white"
          role="img"
          aria-label="User profile"
        >
          GS
        </div>
      </div>
    </header>
  )
}
