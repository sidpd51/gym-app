import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { MembershipRow, PlanSnapshotRow } from './membership.model.js';

const FILTER = `WHERE (? IS NULL OR status = ?) AND (? IS NULL OR member_id = ?)`;
const filterParams = (f: { status?: string; memberId?: string }) => {
  const status = f.status || null;
  const memberId = f.memberId || null;
  return [status, status, memberId, memberId];
};

export interface NewMembership {
  memberId: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  amount: string;
}

/** Data access for `memberships`: all SQL, no business rules. */
export class MembershipRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<MembershipRow>(db, 'SELECT * FROM memberships WHERE id = ?', [id]);
  }

  list(f: { status?: string; memberId?: string }, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<MembershipRow>(
      db,
      `SELECT * FROM memberships ${FILTER} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...filterParams(f), limit, offset],
    );
  }

  async count(f: { status?: string; memberId?: string }, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM memberships ${FILTER}`, filterParams(f));
    return row!.count;
  }

  /** The plan a new membership is derived from (name/price/duration snapshot). */
  findPlanSnapshot(planId: string, db: Db = this.pool) {
    return queryOne<PlanSnapshotRow>(db, 'SELECT * FROM membership_plans WHERE id = ?', [planId]);
  }

  async insert(m: NewMembership, db: Db = this.pool): Promise<MembershipRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO memberships (id, member_id, plan_id, plan_name, start_date, end_date, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [id, m.memberId, m.planId, m.planName, m.startDate, m.endDate, m.amount],
    );
    return (await this.findById(id, db))!;
  }
}
