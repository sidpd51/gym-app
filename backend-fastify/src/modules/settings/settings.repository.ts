import { queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { SettingsRow } from './settings.model.js';
import type { SettingsInput } from './settings.schemas.js';

export class SettingsRepository {
  constructor(private readonly pool: DbPool) {}

  get(db: Db = this.pool) {
    return queryOne<SettingsRow>(db, 'SELECT * FROM gym_settings WHERE id = 1');
  }

  /** Partial update: null/undefined fields are left unchanged. */
  update(r: SettingsInput, db: Db = this.pool) {
    return queryOne<SettingsRow>(
      db,
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
  }
}
