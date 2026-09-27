import { useState } from 'react'
import { SETTINGS_SECTIONS } from './types/settings.types'
import type { GymSettings, SettingsSection } from './types/settings.types'
import { useSettings } from './hooks/useSettings'
import { SettingsSidebar } from './components/SettingsSidebar'
import { GymProfileSettings } from './components/GymProfileSettings'
import { MembershipSettings } from './components/MembershipSettings'
import { AttendanceSettings } from './components/AttendanceSettings'
import { PreferenceSettings } from './components/PreferenceSettings'

export function SettingsPage() {
  const { settings } = useSettings()
  const [activeSection, setActiveSection] = useState<SettingsSection>('gym-profile')
  const [settingsSource, setSettingsSource] = useState<GymSettings>(settings)

  function handleSave(updated: GymSettings) {
    setSettingsSource(updated)
  }

  const activeLabel = SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label ?? ''

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Manage your gym's configuration.</p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="lg:w-44 lg:shrink-0">
          <SettingsSidebar activeSection={activeSection} onSelect={setActiveSection} />
        </aside>

        <div className="min-w-0 flex-1">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-400 lg:hidden">
            {activeLabel}
          </p>

          {activeSection === 'gym-profile' && (
            <GymProfileSettings settings={settingsSource} onSave={handleSave} />
          )}
          {activeSection === 'membership' && (
            <MembershipSettings settings={settingsSource} onSave={handleSave} />
          )}
          {activeSection === 'attendance' && (
            <AttendanceSettings settings={settingsSource} onSave={handleSave} />
          )}
          {activeSection === 'preferences' && (
            <PreferenceSettings settings={settingsSource} onSave={handleSave} />
          )}
        </div>
      </div>
    </div>
  )
}
