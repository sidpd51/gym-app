import { badRequest } from '../../common/errors.js';
import { nowIST } from '../../common/time.js';
import { dateString } from '../../common/validate.js';
import { queryMany, queryOne, type DbPool } from '../../db/pool.js';

export interface DateRange {
  from: string;
  to: string;
}

/** shopspring/decimal marshals as a quoted string with trailing zeros trimmed ("1500", "99.5"). */
export function decimalString(v: string | null | undefined): string {
  if (v === null || v === undefined) return '0';
  return v.includes('.') ? v.replace(/0+$/, '').replace(/\.$/, '') : v;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Current month in Asia/Kolkata, up to today. */
export function defaultRange(): DateRange {
  const n = nowIST();
  return { from: `${n.year}-${pad(n.month)}-01`, to: `${n.year}-${pad(n.month)}-${pad(n.day)}` };
}

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

interface MonthlyPoint {
  month: string;
  revenue: string;
  expenses: string;
}

export class ReportService {
  constructor(private readonly pool: DbPool) {}

  private count(sql: string, params: unknown[]) {
    return queryOne<{ c: number }>(this.pool, sql, params).then((r) => r!.c);
  }

  async overview(rng: DateRange) {
    const p = [rng.from, rng.to];
    const revenue = (await queryOne<{ total: string }>(
      this.pool,
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments
       WHERE status = 'COMPLETED' AND payment_date >= $1 AND payment_date <= $2`, p))!.total;
    const expenses = (await queryOne<{ total: string }>(
      this.pool,
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM expenses
       WHERE expense_date >= $1 AND expense_date <= $2`, p))!.total;
    const net = (await queryOne<{ n: string }>(this.pool, 'SELECT ($1::numeric - $2::numeric)::text AS n', [revenue, expenses]))!.n;

    const activeMembers = await this.count("SELECT COUNT(*)::bigint AS c FROM members WHERE status = 'ACTIVE'", []);
    const newMembers = await this.count(
      'SELECT COUNT(*)::bigint AS c FROM members WHERE joining_date >= $1 AND joining_date <= $2', p);
    const attendanceCount = await this.count(
      'SELECT COUNT(*)::bigint AS c FROM attendance WHERE attendance_date >= $1 AND attendance_date <= $2', p);
    const newLeads = await this.count(
      'SELECT COUNT(*)::bigint AS c FROM leads WHERE created_at::date >= $1 AND created_at::date <= $2', p);

    const revRows = await queryMany<{ month: string; revenue: string }>(
      this.pool,
      `SELECT TO_CHAR(payment_date, 'Mon ''YY') AS month,
              DATE_TRUNC('month', payment_date)::date AS month_date,
              COALESCE(SUM(amount), 0)::numeric AS revenue
       FROM payments WHERE status = 'COMPLETED' AND payment_date >= $1 AND payment_date <= $2
       GROUP BY month, month_date ORDER BY month_date`, p);
    const expRows = await queryMany<{ month: string; expenses: string }>(
      this.pool,
      `SELECT TO_CHAR(expense_date, 'Mon ''YY') AS month,
              DATE_TRUNC('month', expense_date)::date AS month_date,
              COALESCE(SUM(amount), 0)::numeric AS expenses
       FROM expenses WHERE expense_date >= $1 AND expense_date <= $2
       GROUP BY month, month_date ORDER BY month_date`, p);

    // Merge revenue + expense months by label, revenue months first (insertion order).
    const byMonth = new Map<string, MonthlyPoint>();
    const point = (m: string) => {
      let pt = byMonth.get(m);
      if (!pt) byMonth.set(m, (pt = { month: m, revenue: '0', expenses: '0' }));
      return pt;
    };
    for (const r of revRows) point(r.month).revenue = decimalString(r.revenue);
    for (const r of expRows) point(r.month).expenses = decimalString(r.expenses);

    return {
      revenue: decimalString(revenue),
      expenses: decimalString(expenses),
      netCashFlow: decimalString(net),
      activeMembers,
      newMembers,
      attendanceCount,
      newLeads,
      revenueVsExpenses: [...byMonth.values()],
    };
  }
}
