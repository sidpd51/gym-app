import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { ConvertedMemberRow, LeadRow } from './lead.model.js';
import type { ConvertLeadInput, CreateLeadInput, UpdateLeadInput } from './lead.schemas.js';

const STATUS_FILTER = `WHERE ($1::lead_status IS NULL OR status = $1::lead_status)`;

/**
 * Data access for `leads` (plus the member insert used by lead conversion).
 * All SQL for the module lives here; no business rules. Methods accept an
 * optional executor so the service can run them inside a transaction.
 */
export class LeadRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<LeadRow>(db, 'SELECT * FROM leads WHERE id = $1', [id]);
  }

  list(status: string | undefined, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<LeadRow>(
      db,
      `SELECT * FROM leads ${STATUS_FILTER} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [status || null, limit, offset],
    );
  }

  async count(status: string | undefined, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM leads ${STATUS_FILTER}`, [status || null]);
    return row!.count;
  }

  async insert(code: string, req: CreateLeadInput, db: Db = this.pool): Promise<LeadRow> {
    const row = await queryOne<LeadRow>(
      db,
      `INSERT INTO leads (lead_code, name, phone, email, source, interested_plan_id, status, notes,
                          last_follow_up_date, next_follow_up_date)
       VALUES ($1,$2,$3,$4,$5,$6,'NEW',$7,NULL,$8) RETURNING *`,
      [code, req.name, req.phone, req.email ?? null, req.source ?? null, req.interestedPlanId ?? null,
       req.notes ?? null, req.nextFollowUpDate ?? null],
    );
    return row!;
  }

  /** Partial update: null/undefined fields are left unchanged. Undefined result = no such lead. */
  update(id: string, req: UpdateLeadInput, db: Db = this.pool) {
    return queryOne<LeadRow>(
      db,
      `UPDATE leads
       SET name = COALESCE($2, name), phone = COALESCE($3, phone), email = COALESCE($4, email),
           source = COALESCE($5::lead_source, source), interested_plan_id = COALESCE($6, interested_plan_id),
           status = COALESCE($7::lead_status, status), notes = COALESCE($8, notes),
           last_follow_up_date = COALESCE($9, last_follow_up_date),
           next_follow_up_date = COALESCE($10, next_follow_up_date)
       WHERE id = $1 RETURNING *`,
      [id, req.name ?? null, req.phone ?? null, req.email ?? null, req.source ?? null,
       req.interestedPlanId ?? null, req.status ?? null, req.notes ?? null,
       req.lastFollowUpDate ?? null, req.nextFollowUpDate ?? null],
    );
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM leads WHERE id = $1', [id]);
  }

  /** Creates the ACTIVE member a lead is converted into. */
  async insertMemberFromLead(
    code: string,
    req: ConvertLeadInput,
    email: string | null,
    db: Db = this.pool,
  ): Promise<ConvertedMemberRow> {
    const row = await queryOne<ConvertedMemberRow>(
      db,
      `INSERT INTO members (member_code, first_name, last_name, phone, email, status, joining_date)
       VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6) RETURNING id, member_code`,
      [code, req.firstName, req.lastName, req.phone, email, req.joiningDate],
    );
    return row!;
  }

  markConverted(leadId: string, memberId: string, db: Db = this.pool) {
    return exec(db, `UPDATE leads SET status = 'CONVERTED', converted_member_id = $2 WHERE id = $1`, [leadId, memberId]);
  }
}
