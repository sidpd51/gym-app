import {
  BadgeCheck,
  BarChart2,
  Bell,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  Dumbbell,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Shield,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/features/auth/hooks/usePermissions'
import type { Permission } from '@/features/auth/permissions/permissions'

interface NavItem {
  label: string
  icon: LucideIcon
  to: string
  permission?: Permission
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Members', icon: Users, to: '/members', permission: 'members:view' },
      { label: 'Memberships', icon: BadgeCheck, to: '/memberships', permission: 'memberships:view' },
      { label: 'Membership Plans', icon: CreditCard, to: '/membership-plans', permission: 'membership-plans:view' },
      { label: 'Attendance', icon: CalendarCheck, to: '/attendance', permission: 'attendance:view' },
      { label: 'Trainers', icon: Dumbbell, to: '/trainers', permission: 'trainers:view' },
      { label: 'Leads', icon: UserPlus, to: '/leads', permission: 'leads:view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', icon: DollarSign, to: '/payments', permission: 'payments:view' },
      { label: 'Expenses', icon: Receipt, to: '/expenses', permission: 'expenses:view' },
    ],
  },
  {
    label: 'Assets',
    items: [
      { label: 'Inventory', icon: Package, to: '/inventory', permission: 'inventory:view' },
      { label: 'Equipment', icon: Wrench, to: '/equipment', permission: 'equipment:view' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', icon: BarChart2, to: '/reports', permission: 'reports:view' },
      { label: 'Notifications', icon: Bell, to: '/notifications', permission: 'notifications:view' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', icon: Shield, to: '/users', permission: 'users:view' },
      { label: 'Audit Logs', icon: ClipboardList, to: '/audit-logs', permission: 'audit-logs:view' },
    ],
  },
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
  const { hasPermission } = usePermissions()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/90 p-0.5">
          <img
            src="/logo.png"
            alt="Bajrang Fitness Club"
            className="h-full w-full object-contain"
          />
        </div>
        <span className="text-sm font-semibold leading-tight text-white">Bajrang Fitness Club</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Main navigation">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || hasPermission(item.permission)
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label || 'root'} className="mb-1">
              {group.label && (
                <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavItemLink key={item.to} item={item} onClick={onNavigate} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {hasPermission('settings:view') && (
        <div className="px-2 pb-4">
          <div className="border-t border-zinc-800 pt-2">
            <NavItemLink item={{ label: 'Settings', icon: Settings, to: '/settings' }} onClick={onNavigate} />
          </div>
        </div>
      )}
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
