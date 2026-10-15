import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { ConvertedMemberRow, LeadRow } from './lead.model.js';
import type { ConvertLeadInput, CreateLeadInput, UpdateLeadInput } from './lead.schemas.js';

const STATUS_FILTER = `WHERE (? IS NULL OR status = ?)`;

/**
 * Data access for `leads` (plus the member insert used by lead conversion).
 * All SQL for the module lives here; no business rules. Methods accept an
 * optional executor so the service can run them inside a transaction.
 */
export class LeadRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<LeadRow>(db, 'SELECT * FROM leads WHERE id = ?', [id]);
  }

  list(status: string | undefined, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<LeadRow>(
      db,
      `SELECT * FROM leads ${STATUS_FILTER} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [status || null, status || null, limit, offset],
    );
  }

  async count(status: string | undefined, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM leads ${STATUS_FILTER}`, [status || null, status || null]);
    return row!.count;
  }

  async insert(code: string, req: CreateLeadInput, db: Db = this.pool): Promise<LeadRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO leads (id, lead_code, name, phone, email, source, interested_plan_id, status, notes,
                          last_follow_up_date, next_follow_up_date)
       VALUES (?,?,?,?,?,?,?,'NEW',?,NULL,?)`,
      [id, code, req.name, req.phone, req.email ?? null, req.source ?? null, req.interestedPlanId ?? null,
       req.notes ?? null, req.nextFollowUpDate ?? null],
    );
    return (await this.findById(id, db))!;
  }

  /** Partial update: null/undefined fields are left unchanged. Undefined result = no such lead. */
  async update(id: string, req: UpdateLeadInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE leads
       SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email),
           source = COALESCE(?, source), interested_plan_id = COALESCE(?, interested_plan_id),
           status = COALESCE(?, status), notes = COALESCE(?, notes),
           last_follow_up_date = COALESCE(?, last_follow_up_date),
           next_follow_up_date = COALESCE(?, next_follow_up_date)
       WHERE id = ?`,
      [req.name ?? null, req.phone ?? null, req.email ?? null, req.source ?? null,
       req.interestedPlanId ?? null, req.status ?? null, req.notes ?? null,
       req.lastFollowUpDate ?? null, req.nextFollowUpDate ?? null, id],
    );
    return matched ? this.findById(id, db) : undefined;
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM leads WHERE id = ?', [id]);
  }

  /** Creates the ACTIVE member a lead is converted into. */
  async insertMemberFromLead(
    code: string,
    req: ConvertLeadInput,
    email: string | null,
    db: Db = this.pool,
  ): Promise<ConvertedMemberRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO members (id, member_code, first_name, last_name, phone, email, status, joining_date)
       VALUES (?,?,?,?,?,?,'ACTIVE',?)`,
      [id, code, req.firstName, req.lastName, req.phone, email, req.joiningDate],
    );
    return { id, member_code: code } as ConvertedMemberRow;
  }

  markConverted(leadId: string, memberId: string, db: Db = this.pool) {
    return exec(db, `UPDATE leads SET status = 'CONVERTED', converted_member_id = ? WHERE id = ?`, [memberId, leadId]);
  }
}
