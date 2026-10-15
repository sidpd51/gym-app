export interface AttendanceRow {
  id: string;
  member_id: string;
  membership_id: string | null;
  attendance_date: string;
  check_in_time: string;
  status: string;
  created_at: Date;
}

export interface AttendanceResponse {
  id: string;
  memberId: string;
  membershipId: string | null;
  attendanceDate: string;
  checkInTime: string;
  status: string;
  createdAt: Date;
}

export function toAttendanceResponse(a: AttendanceRow): AttendanceResponse {
  return {
    id: a.id,
    memberId: a.member_id,
    membershipId: a.membership_id,
    attendanceDate: a.attendance_date,
    checkInTime: a.check_in_time,
    status: a.status,
    createdAt: a.created_at,
  };
}

export interface GymSettingsRow {
  allow_attendance_for_expired_membership: boolean;
}
