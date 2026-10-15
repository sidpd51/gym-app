import { exec, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { SettingsRow } from './settings.model.js';
import type { SettingsInput } from './settings.schemas.js';

export class SettingsRepository {
  constructor(private readonly pool: DbPool) {}

  get(db: Db = this.pool) {
    return queryOne<SettingsRow>(db, 'SELECT * FROM gym_settings WHERE id = 1');
  }

  /** Partial update: null/undefined fields are left unchanged. */
  async update(r: SettingsInput, db: Db = this.pool) {
    await exec(
      db,
      `UPDATE gym_settings SET
         gym_name = COALESCE(?, gym_name), phone = COALESCE(?, phone), email = COALESCE(?, email),
         address = COALESCE(?, address), currency = COALESCE(?, currency), timezone = COALESCE(?, timezone),
         date_format = COALESCE(?, date_format),
         membership_grace_period_days = COALESCE(?, membership_grace_period_days),
         attendance_start_time = COALESCE(?, attendance_start_time),
         attendance_end_time = COALESCE(?, attendance_end_time),
         allow_attendance_for_expired_membership = COALESCE(?, allow_attendance_for_expired_membership)
       WHERE id = 1`,
      [
        r.gymName ?? null, r.phone ?? null, r.email ?? null, r.address ?? null, r.currency ?? null,
        r.timezone ?? null, r.dateFormat ?? null, r.membershipGracePeriodDays ?? null,
        r.attendanceStartTime ?? null, r.attendanceEndTime ?? null, r.allowAttendanceForExpiredMembership ?? null,
      ],
    );
    return this.get(db);
  }
}
