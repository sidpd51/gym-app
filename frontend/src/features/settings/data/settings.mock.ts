import type { GymSettings } from '../types/settings.types'

export const defaultSettings: GymSettings = {
  gymName: 'FitZone Gym',
  phone: '9876543210',
  email: 'contact@fitzone.example',
  address: 'Main Road, Ranchi, Jharkhand 834001',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  membershipGracePeriodDays: 0,
  attendanceStartTime: '05:00',
  attendanceEndTime: '22:00',
  allowAttendanceForExpiredMembership: false,
}
