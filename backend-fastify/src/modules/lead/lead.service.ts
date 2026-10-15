import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { conflict, notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { isUniqueViolation, withTx, type DbPool } from '../../db/pool.js';
import { toLeadResponse } from './lead.model.js';
import type { LeadRepository } from './lead.repository.js';
import type { ConvertLeadInput, CreateLeadInput, UpdateLeadInput } from './lead.schemas.js';

/** Business rules, transactions and audit. No SQL (see repository) and no HTTP (see controller). */
export class LeadService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: LeadRepository,
  ) {}

  async getById(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw notFound('LEAD_NOT_FOUND', 'Lead not found.');
    return toLeadResponse(row);
  }

  async list(q: PageQuery, f: { status?: string }) {
    const rows = await this.repo.list(f.status, q.pageSize, pageOffset(q));
    const total = await this.repo.count(f.status);
    return newPage(rows.map(toLeadResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreateLeadInput) {
    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'lead');
      const l = await this.repo.insert(code, req, tx);
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
      const l = await this.repo.update(id, req, tx);
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
      const existing = await this.repo.findById(id, tx);
      if (!existing) throw notFound('LEAD_NOT_FOUND', 'Lead not found.');
      await this.repo.delete(id, tx);
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'LEAD', entityId: id, entityName: existing.name,
        description: `Deleted lead ${existing.lead_code}`,
      });
    });
  }

  /** Turns a lead into a member in one transaction; returns the new member id. */
  async convert(actor: string, leadId: string, req: ConvertLeadInput): Promise<string> {
    return withTx(this.pool, async (tx) => {
      const lead = await this.repo.findById(leadId, tx);
      if (!lead) throw notFound('LEAD_NOT_FOUND', 'Lead not found.');
      if (lead.status === 'CONVERTED') throw conflict('LEAD_ALREADY_CONVERTED', 'This lead has already been converted.');
      const code = await nextCode(tx, 'member');
      let member;
      try {
        member = await this.repo.insertMemberFromLead(code, req, lead.email, tx);
      } catch (err) {
        if (isUniqueViolation(err)) throw conflict('MEMBER_PHONE_DUPLICATE', 'A member with this phone number already exists.');
        throw err;
      }
      await this.repo.markConverted(leadId, member.id, tx);
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'LEAD', entityId: leadId, entityName: lead.name,
        description: `Converted lead ${lead.lead_code} to member ${member.member_code}`,
      });
      return member.id;
    });
  }
}
