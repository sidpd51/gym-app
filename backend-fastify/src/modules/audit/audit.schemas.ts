import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery, type PageQuery } from '../../common/pagination.js';
import { dateString } from '../../common/validate.js';

export interface AuditFilter {
  action: string | null;
  entityType: string | null;
  userId: string | null;
  status: string | null;
  /** ISO instants, inclusive. */
  from: string | null;
  to: string | null;
}

/** Parses paging + filter query params; the `to` date is inclusive of the whole day. */
export function parseAuditQuery(query: Record<string, string>): { page: PageQuery; filter: AuditFilter } {
  const page = parsePageQuery(query);
  if (query.userId && !z.uuid().safeParse(query.userId).success) throw badRequest('INVALID_UUID', 'Invalid userId.');
  let from: string | null = null;
  let to: string | null = null;
  if (page.fromDate) {
    if (!dateString.safeParse(page.fromDate).success) throw badRequest('INVALID_DATE', 'from must be YYYY-MM-DD');
    from = `${page.fromDate}T00:00:00Z`;
  }
  if (page.toDate) {
    if (!dateString.safeParse(page.toDate).success) throw badRequest('INVALID_DATE', 'to must be YYYY-MM-DD');
    to = new Date(Date.parse(`${page.toDate}T00:00:00Z`) + 24 * 3600_000 - 1000).toISOString();
  }
  return {
    page,
    filter: {
      action: query.action || null,
      entityType: query.entityType || null,
      userId: query.userId || null,
      status: page.status || null,
      from,
      to,
    },
  };
}
