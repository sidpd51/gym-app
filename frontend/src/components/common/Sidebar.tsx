import {
  BadgeCheck,
  BarChart2,
  Bell,
  Building2,
  CalendarCheck,
  CreditCard,
  DollarSign,
  Dumbbell,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  icon: LucideIcon
  to: string
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Members', icon: Users, to: '/members' },
  { label: 'Memberships', icon: BadgeCheck, to: '/memberships' },
  { label: 'Membership Plans', icon: CreditCard, to: '/membership-plans' },
  { label: 'Attendance', icon: CalendarCheck, to: '/attendance' },
  { label: 'Payments', icon: DollarSign, to: '/payments' },
  { label: 'Trainers', icon: Dumbbell, to: '/trainers' },
  { label: 'Leads', icon: UserPlus, to: '/leads' },
  { label: 'Expenses', icon: Receipt, to: '/expenses' },
  { label: 'Inventory', icon: Package, to: '/inventory' },
  { label: 'Equipment', icon: Wrench, to: '/equipment' },
  { label: 'Reports', icon: BarChart2, to: '/reports' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
]

function NavItemLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-zinc-700 text-white'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
        )
      }
    >
      <item.icon size={16} aria-hidden="true" />
      {item.label}
    </NavLink>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <Building2 size={18} className="shrink-0 text-white" aria-hidden="true" />
        <span className="text-sm font-semibold text-white">Gym Management</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-2" aria-label="Main navigation">
        {mainNavItems.map((item) => (
          <NavItemLink key={item.to} item={item} onClick={onNavigate} />
        ))}
      </nav>

      <div className="px-2 pb-4">
        <div className="border-t border-zinc-800 pt-2">
          <NavItemLink item={{ label: 'Settings', icon: Settings, to: '/settings' }} onClick={onNavigate} />
        </div>
      </div>
    </div>
  )
}

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, onMobileClose])

  return (
    <>
      {/* Desktop sidebar — always visible at md+ */}
      <aside className="hidden w-64 shrink-0 flex-col bg-zinc-900 md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={onMobileClose}
          />
          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 w-64 bg-zinc-900"
          >
            <button
              className="absolute right-3 top-3 rounded p-1 text-zinc-400 hover:text-white"
              onClick={onMobileClose}
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={onMobileClose} />
          </div>
        </div>
      )}
    </>
  )
}
