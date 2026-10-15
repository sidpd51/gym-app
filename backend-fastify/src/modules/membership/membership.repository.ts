import { queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { MembershipRow, PlanSnapshotRow } from './membership.model.js';

const FILTER = `WHERE ($1::membership_status IS NULL OR status = $1::membership_status)
  AND ($2::uuid IS NULL OR member_id = $2::uuid)`;

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
    return queryOne<MembershipRow>(db, 'SELECT * FROM memberships WHERE id = $1', [id]);
  }

  list(f: { status?: string; memberId?: string }, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<MembershipRow>(
      db,
      `SELECT * FROM memberships ${FILTER} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [f.status || null, f.memberId || null, limit, offset],
    );
  }

  async count(f: { status?: string; memberId?: string }, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM memberships ${FILTER}`, [
      f.status || null,
      f.memberId || null,
    ]);
    return row!.count;
  }

  /** The plan a new membership is derived from (name/price/duration snapshot). */
  findPlanSnapshot(planId: string, db: Db = this.pool) {
    return queryOne<PlanSnapshotRow>(db, 'SELECT * FROM membership_plans WHERE id = $1', [planId]);
  }

  async insert(m: NewMembership, db: Db = this.pool): Promise<MembershipRow> {
    const row = await queryOne<MembershipRow>(
      db,
      `INSERT INTO memberships (member_id, plan_id, plan_name, start_date, end_date, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE') RETURNING *`,
      [m.memberId, m.planId, m.planName, m.startDate, m.endDate, m.amount],
    );
    return row!;
  }
}
