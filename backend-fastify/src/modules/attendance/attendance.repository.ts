import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { AttendanceRow, GymSettingsRow } from './attendance.model.js';

const FILTER = `WHERE (? IS NULL OR member_id = ?)
  AND (? IS NULL OR attendance_date >= ?)
  AND (? IS NULL OR attendance_date <= ?)`;
const filterParams = (f: AttendanceFilter) => [f.memberId, f.memberId, f.from, f.from, f.to, f.to];

export interface AttendanceFilter {
  memberId: string | null;
  from: string | null;
  to: string | null;
}

/** Data access for `attendance` (plus the settings/membership lookups its rules need): all SQL, no business rules. */
export class AttendanceRepository {
  constructor(private readonly pool: DbPool) {}

  list(f: AttendanceFilter, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<AttendanceRow>(
      db,
      `SELECT * FROM attendance ${FILTER} ORDER BY attendance_date DESC, check_in_time DESC LIMIT ? OFFSET ?`,
      [...filterParams(f), limit, offset],
    );
  }

  async count(f: AttendanceFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM attendance ${FILTER}`, filterParams(f));
    return row!.count;
  }

  getGymSettings(db: Db = this.pool) {
    return queryOne<GymSettingsRow>(db, 'SELECT * FROM gym_settings WHERE id = 1');
  }

  /** The member's active membership with the latest end date, if any. */
  findActiveMembershipId(memberId: string, db: Db = this.pool) {
    return queryOne<{ id: string }>(
      db,
      `SELECT id FROM memberships WHERE member_id = ? AND status = 'ACTIVE' ORDER BY end_date DESC LIMIT 1`,
      [memberId],
    );
  }

  async insert(a: { memberId: string; membershipId: string | null; date: string; checkIn: string }, db: Db = this.pool): Promise<AttendanceRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO attendance (id, member_id, membership_id, attendance_date, check_in_time)
       VALUES (?, ?, ?, ?, ?)`,
      [id, a.memberId, a.membershipId, a.date, a.checkIn],
    );
    return (await queryOne<AttendanceRow>(db, 'SELECT * FROM attendance WHERE id = ?', [id]))!;
  }
}
