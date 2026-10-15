import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { exec, isUniqueViolation, queryMany, queryOne, withTx, type DbPool } from '../../db/pool.js';

interface LeadRow {
  id: string; lead_code: string; name: string; phone: string; email: string | null; source: string | null;
  interested_plan_id: string | null; status: string; notes: string | null;
  last_follow_up_date: string | null; next_follow_up_date: string | null;
  converted_member_id: string | null; created_at: Date;
}

export const toLeadResponse = (l: LeadRow) => ({
  id: l.id,
  leadCode: l.lead_code,
  name: l.name,
  phone: l.phone,
  email: l.email,
  source: l.source,
  interestedPlanId: l.interested_plan_id,
  status: l.status,
  notes: l.notes,
  lastFollowUpDate: l.last_follow_up_date,
  nextFollowUpDate: l.next_follow_up_date,
  convertedMemberId: l.converted_member_id,
  createdAt: l.created_at,
});

type Nullish<T> = { [K in keyof T]?: T[K] | null };
export interface CreateLeadInput {
  name: string; phone: string; email?: string | null; source?: string | null;
  interestedPlanId?: string | null; notes?: string | null; nextFollowUpDate?: string | null;
}
export type UpdateLeadInput = Nullish<CreateLeadInput> & { status?: string | null; lastFollowUpDate?: string | null };
export interface ConvertInput { firstName: string; lastName: string; joiningDate: string; phone: string }

const STATUS_FILTER = `WHERE ($1::lead_status IS NULL OR status = $1::lead_status)`;

export class LeadService {
  constructor(private readonly pool: DbPool) {}

  async getByID(id: string) {
    const row = await queryOne<LeadRow>(this.pool, 'SELECT * FROM leads WHERE id = $1', [id]);
    if (!row) throw notFound('LEAD_NOT_FOUND', 'Lead not found.');
    return toLeadResponse(row);
  }

  async list(q: PageQuery, f: { status?: string }) {
    const status = f.status || null;
    const rows = await queryMany<LeadRow>(
      this.pool,
      `SELECT * FROM leads ${STATUS_FILTER} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [status, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM leads ${STATUS_FILTER}`, [status]))!.count;
    return newPage(rows.map(toLeadResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreateLeadInput) {
    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'lead');
      const l = (await queryOne<LeadRow>(
        tx,
        `INSERT INTO leads (lead_code, name, phone, email, source, interested_plan_id, status, notes,
                            last_follow_up_date, next_follow_up_date)
         VALUES ($1,$2,$3,$4,$5,$6,'NEW',$7,NULL,$8) RETURNING *`,
        [code, req.name, req.phone, req.email ?? null, req.source ?? null, req.interestedPlanId ?? null,
         req.notes ?? null, req.nextFollowUpDate ?? null],
      ))!;
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'LEAD', entityId: l.id, entityName: l.name,
        description: `Created lead ${l.lead_code}`,
      });
      return l;
    });
    return toLeadResponse(created);
  }

  async update(actor: string, id: string, req: UpdateLeadInput) {
    const out = await withTx(this.pool, async (tx) => {
      const l = await queryOne<LeadRow>(
        tx,
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
      if (!l) throw notFound('LEAD_NOT_FOUND', 'Lead not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'LEAD', entityId: l.id, entityName: l.name,
        description: 'Updated lead',
      });
      return l;
    });
    return toLeadResponse(out);
  }

  async delete(actor: string, id: string) {
    await withTx(this.pool, async (tx) => {
      const existing = await queryOne<LeadRow>(tx, 'SELECT * FROM leads WHERE id = $1', [id]);
      if (!existing) throw notFound('LEAD_NOT_FOUND', 'Lead not found.');
      await exec(tx, 'DELETE FROM leads WHERE id = $1', [id]);
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'LEAD', entityId: id, entityName: existing.name,
        description: `Deleted lead ${existing.lead_code}`,
      });
    });
  }

  /** Turns a lead into a member in one transaction; returns the new member id. */
  async convert(actor: string, leadId: string, req: ConvertInput): Promise<string> {
    return withTx(this.pool, async (tx) => {
      const lead = await queryOne<LeadRow>(tx, 'SELECT * FROM leads WHERE id = $1', [leadId]);
      if (!lead) throw notFound('LEAD_NOT_FOUND', 'Lead not found.');
      if (lead.status === 'CONVERTED') throw conflict('LEAD_ALREADY_CONVERTED', 'This lead has already been converted.');
      const code = await nextCode(tx, 'member');
      let member: { id: string; member_code: string };
      try {
        member = (await queryOne(
          tx,
          `INSERT INTO members (member_code, first_name, last_name, phone, email, status, joining_date)
           VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6) RETURNING id, member_code`,
          [code, req.firstName, req.lastName, req.phone, lead.email, req.joiningDate],
        ))!;
      } catch (err) {
        if (isUniqueViolation(err)) throw conflict('MEMBER_PHONE_DUPLICATE', 'A member with this phone number already exists.');
        throw err;
      }
      await exec(tx, `UPDATE leads SET status = 'CONVERTED', converted_member_id = $2 WHERE id = $1`, [leadId, member.id]);
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'LEAD', entityId: leadId, entityName: lead.name,
        description: `Converted lead ${lead.lead_code} to member ${member.member_code}`,
      });
      return member.id;
    });
  }
}
