/** The single row (id = 1) of `gym_settings`. */
export interface SettingsRow {
  gym_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  date_format: string;
  membership_grace_period_days: number;
  attendance_start_time: string;
  attendance_end_time: string;
  allow_attendance_for_expired_membership: boolean;
}

export interface SettingsResponse {
  gymName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  dateFormat: string;
  membershipGracePeriodDays: number;
  attendanceStartTime: string;
  attendanceEndTime: string;
  allowAttendanceForExpiredMembership: boolean;
}

export function toSettingsResponse(s: SettingsRow): SettingsResponse {
  return {
    gymName: s.gym_name,
    phone: s.phone,
    email: s.email,
    address: s.address,
    currency: s.currency,
    timezone: s.timezone,
    dateFormat: s.date_format,
    membershipGracePeriodDays: s.membership_grace_period_days,
    attendanceStartTime: s.attendance_start_time,
    attendanceEndTime: s.attendance_end_time,
    allowAttendanceForExpiredMembership: s.allow_attendance_for_expired_membership,
  };
}
