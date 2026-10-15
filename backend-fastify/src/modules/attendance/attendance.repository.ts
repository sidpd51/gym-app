import { queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { AttendanceRow, GymSettingsRow } from './attendance.model.js';

const FILTER = `WHERE ($1::uuid IS NULL OR member_id = $1::uuid)
  AND ($2::date IS NULL OR attendance_date >= $2::date)
  AND ($3::date IS NULL OR attendance_date <= $3::date)`;

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
      `SELECT * FROM attendance ${FILTER} ORDER BY attendance_date DESC, check_in_time DESC LIMIT $4 OFFSET $5`,
      [f.memberId, f.from, f.to, limit, offset],
    );
  }

  async count(f: AttendanceFilter, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM attendance ${FILTER}`, [f.memberId, f.from, f.to]);
    return row!.count;
  }

  getGymSettings(db: Db = this.pool) {
    return queryOne<GymSettingsRow>(db, 'SELECT * FROM gym_settings WHERE id = 1');
  }

  /** The member's active membership with the latest end date, if any. */
  findActiveMembershipId(memberId: string, db: Db = this.pool) {
    return queryOne<{ id: string }>(
      db,
      `SELECT id FROM memberships WHERE member_id = $1 AND status = 'ACTIVE' ORDER BY end_date DESC LIMIT 1`,
      [memberId],
    );
  }

  async insert(a: { memberId: string; membershipId: string | null; date: string; checkIn: string }, db: Db = this.pool): Promise<AttendanceRow> {
    const row = await queryOne<AttendanceRow>(
      db,
      `INSERT INTO attendance (member_id, membership_id, attendance_date, check_in_time)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [a.memberId, a.membershipId, a.date, a.checkIn],
    );
    return row!;
  }
}
