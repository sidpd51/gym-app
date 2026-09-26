import { cn } from '@/lib/utils'
import { SETTINGS_SECTIONS } from '../types/settings.types'
import type { SettingsSection } from '../types/settings.types'

interface SettingsSidebarProps {
  activeSection: SettingsSection
  onSelect: (section: SettingsSection) => void
}

export function SettingsSidebar({ activeSection, onSelect }: SettingsSidebarProps) {
  return (
    <>
      {/* Mobile: horizontal tab bar */}
      <nav
        className="flex overflow-x-auto border-b border-zinc-200 lg:hidden"
        aria-label="Settings sections"
      >
        {SETTINGS_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeSection === s.id
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* Desktop: vertical list */}
      <nav
        className="hidden flex-col gap-0.5 lg:flex"
        aria-label="Settings sections"
      >
        {SETTINGS_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              'rounded-md px-3 py-2 text-left text-sm transition-colors',
              activeSection === s.id
                ? 'bg-zinc-100 font-medium text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </>
  )
}
