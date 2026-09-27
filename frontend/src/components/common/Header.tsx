import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu, User } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/useAuth'
import { UserAvatar } from '@/features/users/components/UserAvatar'
import { GlobalSearch } from './GlobalSearch'

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
  '/inventory': 'Inventory',
  '/equipment': 'Equipment',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/users': 'Users',
  '/profile': 'Profile',
  '/audit-logs': 'Audit Logs',
}

function getPageTitle(pathname: string): string {
  const direct = PAGE_TITLES[pathname]
  if (direct) return direct
  const segment = `/${pathname.split('/')[1]}`
  return PAGE_TITLES[segment] ?? 'Gym Management System'
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  RECEPTIONIST: 'Receptionist',
  TRAINER: 'Trainer',
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()
  const title = getPageTitle(pathname)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

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
        <GlobalSearch />
        {/* Notifications link */}
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `rounded p-1.5 hover:bg-zinc-100 ${isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`
          }
          aria-label="Notifications"
        >
          <Bell size={18} />
        </NavLink>

        {/* User menu */}
        {user ? (
          <div className="relative ml-1" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-zinc-100"
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <UserAvatar firstName={user.firstName} lastName={user.lastName} />
              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium leading-tight text-zinc-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs leading-tight text-zinc-500">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
              <ChevronDown size={14} className="text-zinc-400" aria-hidden="true" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-md">
                <NavLink
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  <User size={14} aria-hidden="true" />
                  Profile
                </NavLink>
                <div className="mx-1 my-1 border-t border-zinc-100" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={14} aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white"
            role="img"
            aria-label="User profile"
          >
            GS
          </div>
        )}
      </div>
    </header>
  )
}
