import { queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { DateRange } from './report.schemas.js';
import type { MonthlyExpenseRow, MonthlyRevenueRow } from './report.model.js';

/** Read-only aggregate queries for reports. All SQL for the module lives here. */
export class ReportRepository {
  constructor(private readonly pool: DbPool) {}

  private async count(sql: string, params: unknown[], db: Db): Promise<number> {
    return (await queryOne<{ c: number }>(db, sql, params))!.c;
  }

  async sumCompletedPayments(r: DateRange, db: Db = this.pool): Promise<string> {
    return (await queryOne<{ total: string }>(
      db,
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments
       WHERE status = 'COMPLETED' AND payment_date >= $1 AND payment_date <= $2`,
      [r.from, r.to],
    ))!.total;
  }

  async sumExpenses(r: DateRange, db: Db = this.pool): Promise<string> {
    return (await queryOne<{ total: string }>(
      db,
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM expenses
       WHERE expense_date >= $1 AND expense_date <= $2`,
      [r.from, r.to],
    ))!.total;
  }

  /** a - b computed in the database to avoid float drift; returned as text. */
  async subtract(a: string, b: string, db: Db = this.pool): Promise<string> {
    return (await queryOne<{ n: string }>(db, 'SELECT ($1::numeric - $2::numeric)::text AS n', [a, b]))!.n;
  }

  countActiveMembers(db: Db = this.pool) {
    return this.count("SELECT COUNT(*)::bigint AS c FROM members WHERE status = 'ACTIVE'", [], db);
  }

  countNewMembers(r: DateRange, db: Db = this.pool) {
    return this.count('SELECT COUNT(*)::bigint AS c FROM members WHERE joining_date >= $1 AND joining_date <= $2', [r.from, r.to], db);
  }

  countAttendance(r: DateRange, db: Db = this.pool) {
    return this.count('SELECT COUNT(*)::bigint AS c FROM attendance WHERE attendance_date >= $1 AND attendance_date <= $2', [r.from, r.to], db);
  }

  countNewLeads(r: DateRange, db: Db = this.pool) {
    return this.count('SELECT COUNT(*)::bigint AS c FROM leads WHERE created_at::date >= $1 AND created_at::date <= $2', [r.from, r.to], db);
  }

  monthlyRevenue(r: DateRange, db: Db = this.pool) {
    return queryMany<MonthlyRevenueRow>(
      db,
      `SELECT TO_CHAR(payment_date, 'Mon ''YY') AS month,
              DATE_TRUNC('month', payment_date)::date AS month_date,
              COALESCE(SUM(amount), 0)::numeric AS revenue
       FROM payments WHERE status = 'COMPLETED' AND payment_date >= $1 AND payment_date <= $2
       GROUP BY month, month_date ORDER BY month_date`,
      [r.from, r.to],
    );
  }

  monthlyExpenses(r: DateRange, db: Db = this.pool) {
    return queryMany<MonthlyExpenseRow>(
      db,
      `SELECT TO_CHAR(expense_date, 'Mon ''YY') AS month,
              DATE_TRUNC('month', expense_date)::date AS month_date,
              COALESCE(SUM(amount), 0)::numeric AS expenses
       FROM expenses WHERE expense_date >= $1 AND expense_date <= $2
       GROUP BY month, month_date ORDER BY month_date`,
      [r.from, r.to],
    );
  }
}
