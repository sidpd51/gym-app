import { auditLog } from '../../common/audit.js';
import { badRequest, businessRule, conflict } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { nowIST } from '../../common/time.js';
import { dateString } from '../../common/validate.js';
import { isForeignKeyViolation, isUniqueViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';

interface AttendanceRow {
  id: string;
  member_id: string;
  membership_id: string | null;
  attendance_date: string;
  check_in_time: string;
  status: string;
  created_at: Date;
}

export function toAttendanceResponse(a: AttendanceRow) {
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

const FILTER = `WHERE ($1::uuid IS NULL OR member_id = $1::uuid)
  AND ($2::date IS NULL OR attendance_date >= $2::date)
  AND ($3::date IS NULL OR attendance_date <= $3::date)`;

function checkDate(v: string | undefined, field: string): string | null {
  if (!v) return null;
  if (!dateString.safeParse(v).success) throw badRequest('INVALID_DATE', `${field} must be YYYY-MM-DD`);
  return v;
}

export class AttendanceService {
  constructor(private readonly pool: DbPool) {}

  async list(q: PageQuery, f: { memberId?: string; from?: string; to?: string }) {
    const params = [f.memberId || null, checkDate(f.from, 'fromDate'), checkDate(f.to, 'toDate')];
    const rows = await queryMany<AttendanceRow>(
      this.pool,
      `SELECT * FROM attendance ${FILTER} ORDER BY attendance_date DESC, check_in_time DESC LIMIT $4 OFFSET $5`,
      [...params, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM attendance ${FILTER}`, params))!.count;
    return newPage(rows.map(toAttendanceResponse), q.page, q.pageSize, total);
  }

  /**
   * Records a check-in for today (Asia/Kolkata). Unique per (member, date);
   * honours the allow_attendance_for_expired_membership setting.
   */
  async mark(actor: string, req: { memberId: string }) {
    const now = nowIST();
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${now.year}-${pad(now.month)}-${pad(now.day)}`;
    const checkIn = `${pad(now.hour)}:${pad(now.minute)}`;

    const settings = await queryOne<{ allow_attendance_for_expired_membership: boolean }>(
      this.pool, 'SELECT * FROM gym_settings WHERE id = 1',
    );
    if (!settings) throw new Error('gym_settings row missing');
    const membership = await queryOne<{ id: string }>(
      this.pool,
      `SELECT id FROM memberships WHERE member_id = $1 AND status = 'ACTIVE' ORDER BY end_date DESC LIMIT 1`,
      [req.memberId],
    );
    if (!membership && !settings.allow_attendance_for_expired_membership) {
      throw businessRule(
        'ATTENDANCE_NOT_ALLOWED',
        'Member has no active membership and the gym does not allow attendance for expired memberships.',
      );
    }

    const created = await withTx(this.pool, async (tx) => {
      let a: AttendanceRow;
      try {
        a = (await queryOne<AttendanceRow>(
          tx,
          `INSERT INTO attendance (member_id, membership_id, attendance_date, check_in_time)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [req.memberId, membership?.id ?? null, today, checkIn],
        ))!;
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw conflict('ATTENDANCE_ALREADY_MARKED', 'Attendance has already been marked for this member today.');
        }
        if (isForeignKeyViolation(err)) throw badRequest('INVALID_REFERENCE', 'Member not found.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'ATTENDANCE', entityId: a.id,
        description: `Attendance marked at ${checkIn}`,
      });
      return a;
    });
    return toAttendanceResponse(created);
  }
}
