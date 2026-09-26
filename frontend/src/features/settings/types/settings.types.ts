export type Currency = 'INR'

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

export interface GymSettings {
  gymName: string
  phone?: string
  email?: string
  address?: string
  currency: Currency
  timezone: string
  dateFormat: DateFormat
  membershipGracePeriodDays: number
  attendanceStartTime?: string
  attendanceEndTime?: string
  allowAttendanceForExpiredMembership: boolean
}

export type SettingsSection = 'gym-profile' | 'membership' | 'attendance' | 'preferences'

export const SETTINGS_SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'gym-profile', label: 'Gym Profile' },
  { id: 'membership', label: 'Membership' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'preferences', label: 'Preferences' },
]
