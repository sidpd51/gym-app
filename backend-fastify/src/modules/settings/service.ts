import { auditLog } from '../../common/audit.js';
import { badRequest } from '../../common/errors.js';
import { queryOne, withTx, type DbPool } from '../../db/pool.js';

export interface SettingsInput {
  gymName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  currency?: string | null;
  timezone?: string | null;
  dateFormat?: string | null;
  membershipGracePeriodDays?: number | null;
  attendanceStartTime?: string | null;
  attendanceEndTime?: string | null;
  allowAttendanceForExpiredMembership?: boolean | null;
}

function toResponse(s: any) {
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

export class SettingsService {
  constructor(private readonly pool: DbPool) {}

  async get() {
    return toResponse(await queryOne(this.pool, 'SELECT * FROM gym_settings WHERE id = 1'));
  }

  async update(actor: string, r: SettingsInput) {
    if (r.attendanceStartTime != null && r.attendanceEndTime != null && r.attendanceEndTime <= r.attendanceStartTime) {
      throw badRequest('INVALID_TIME_RANGE', 'attendanceEndTime must be after attendanceStartTime.');
    }
    const row = await withTx(this.pool, async (tx) => {
      const updated = await queryOne(
        tx,
        `UPDATE gym_settings SET
           gym_name = COALESCE($1, gym_name), phone = COALESCE($2, phone), email = COALESCE($3, email),
           address = COALESCE($4, address), currency = COALESCE($5, currency), timezone = COALESCE($6, timezone),
           date_format = COALESCE($7, date_format),
           membership_grace_period_days = COALESCE($8, membership_grace_period_days),
           attendance_start_time = COALESCE($9, attendance_start_time),
           attendance_end_time = COALESCE($10, attendance_end_time),
           allow_attendance_for_expired_membership = COALESCE($11, allow_attendance_for_expired_membership)
         WHERE id = 1 RETURNING *`,
        [
          r.gymName ?? null, r.phone ?? null, r.email ?? null, r.address ?? null, r.currency ?? null,
          r.timezone ?? null, r.dateFormat ?? null, r.membershipGracePeriodDays ?? null,
          r.attendanceStartTime ?? null, r.attendanceEndTime ?? null, r.allowAttendanceForExpiredMembership ?? null,
        ],
      );
      await auditLog(tx, { userId: actor, action: 'UPDATE', entityType: 'SETTINGS', entityId: '1', description: 'Updated gym settings' });
      return updated;
    });
    return toResponse(row);
  }
}
