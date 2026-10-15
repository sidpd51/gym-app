import { notFound } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import { toAuditResponse } from './audit.model.js';
import type { AuditRepository } from './audit.repository.js';
import type { AuditFilter } from './audit.schemas.js';

export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async list(q: PageQuery, filter: AuditFilter) {
    const rows = await this.repo.list(filter, q.pageSize, pageOffset(q));
    const total = await this.repo.count(filter);
    return newPage(rows.map(toAuditResponse), q.page, q.pageSize, total);
  }

  async get(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw notFound('AUDIT_NOT_FOUND', 'Audit log not found.');
    return toAuditResponse(row);
  }
}
