import { badRequest } from '../../common/errors.js';
import { nowIST } from '../../common/time.js';
import { dateString } from '../../common/validate.js';

export interface DateRange {
  from: string;
  to: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Current month in Asia/Kolkata, up to today. */
export function defaultRange(): DateRange {
  const n = nowIST();
  return { from: `${n.year}-${pad(n.month)}-01`, to: `${n.year}-${pad(n.month)}-${pad(n.day)}` };
}

/** Reads optional fromDate/toDate query params (YYYY-MM-DD), defaulting to the current IST month. */
export function parseRange(query: unknown): DateRange {
  const q = (query ?? {}) as Record<string, unknown>;
  const rng = defaultRange();
  if (typeof q.fromDate === 'string' && q.fromDate !== '') {
    if (!dateString.safeParse(q.fromDate).success) throw badRequest('INVALID_DATE', 'fromDate must be YYYY-MM-DD');
    rng.from = q.fromDate;
  }
  if (typeof q.toDate === 'string' && q.toDate !== '') {
    if (!dateString.safeParse(q.toDate).success) throw badRequest('INVALID_DATE', 'toDate must be YYYY-MM-DD');
    rng.to = q.toDate;
  }
  return rng;
}
