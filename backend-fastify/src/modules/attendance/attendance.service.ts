import { auditLog } from '../../common/audit.js';
import { badRequest, businessRule, conflict } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { nowIST } from '../../common/time.js';
import { dateString } from '../../common/validate.js';
import { isForeignKeyViolation, isUniqueViolation, withTx, type DbPool } from '../../db/pool.js';
import { toAttendanceResponse } from './attendance.model.js';
import type { AttendanceRepository } from './attendance.repository.js';
import type { MarkAttendanceInput } from './attendance.schemas.js';

function checkDate(v: string | undefined, field: string): string | null {
  if (!v) return null;
  if (!dateString.safeParse(v).success) throw badRequest('INVALID_DATE', `${field} must be YYYY-MM-DD`);
  return v;
}

/** Business rules, transactions and audit for attendance. */
export class AttendanceService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: AttendanceRepository,
  ) {}

  async list(q: PageQuery, f: { memberId?: string; from?: string; to?: string }) {
    const filter = { memberId: f.memberId || null, from: checkDate(f.from, 'fromDate'), to: checkDate(f.to, 'toDate') };
    const rows = await this.repo.list(filter, q.pageSize, pageOffset(q));
    const total = await this.repo.count(filter);
    return newPage(rows.map(toAttendanceResponse), q.page, q.pageSize, total);
  }

  /**
   * Records a check-in for today (Asia/Kolkata). Unique per (member, date);
   * honours the allow_attendance_for_expired_membership setting.
   */
  async mark(actor: string, req: MarkAttendanceInput) {
    const now = nowIST();
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${now.year}-${pad(now.month)}-${pad(now.day)}`;
    const checkIn = `${pad(now.hour)}:${pad(now.minute)}`;

    const settings = await this.repo.getGymSettings();
    if (!settings) throw new Error('gym_settings row missing');
    const membership = await this.repo.findActiveMembershipId(req.memberId);
    if (!membership && !settings.allow_attendance_for_expired_membership) {
      throw businessRule(
        'ATTENDANCE_NOT_ALLOWED',
        'Member has no active membership and the gym does not allow attendance for expired memberships.',
      );
    }

    const created = await withTx(this.pool, async (tx) => {
      let a;
      try {
        a = await this.repo.insert({ memberId: req.memberId, membershipId: membership?.id ?? null, date: today, checkIn }, tx);
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
