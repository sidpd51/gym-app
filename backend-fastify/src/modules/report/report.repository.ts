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
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
       WHERE status = 'COMPLETED' AND payment_date >= ? AND payment_date <= ?`,
      [r.from, r.to],
    ))!.total;
  }

  async sumExpenses(r: DateRange, db: Db = this.pool): Promise<string> {
    return (await queryOne<{ total: string }>(
      db,
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
       WHERE expense_date >= ? AND expense_date <= ?`,
      [r.from, r.to],
    ))!.total;
  }

  /** a - b computed in the database to avoid float drift; returned as text. */
  async subtract(a: string, b: string, db: Db = this.pool): Promise<string> {
    return (await queryOne<{ n: string }>(db, 'SELECT CAST(? AS DECIMAL(20,2)) - CAST(? AS DECIMAL(20,2)) AS n', [a, b]))!.n;
  }

  countActiveMembers(db: Db = this.pool) {
    return this.count("SELECT COUNT(*) AS c FROM members WHERE status = 'ACTIVE'", [], db);
  }

  countNewMembers(r: DateRange, db: Db = this.pool) {
    return this.count('SELECT COUNT(*) AS c FROM members WHERE joining_date >= ? AND joining_date <= ?', [r.from, r.to], db);
  }

  countAttendance(r: DateRange, db: Db = this.pool) {
    return this.count('SELECT COUNT(*) AS c FROM attendance WHERE attendance_date >= ? AND attendance_date <= ?', [r.from, r.to], db);
  }

  countNewLeads(r: DateRange, db: Db = this.pool) {
    return this.count('SELECT COUNT(*) AS c FROM leads WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?', [r.from, r.to], db);
  }

  monthlyRevenue(r: DateRange, db: Db = this.pool) {
    return queryMany<MonthlyRevenueRow>(
      db,
      `SELECT DATE_FORMAT(payment_date, '%b ''%y') AS month,
              DATE_SUB(payment_date, INTERVAL DAYOFMONTH(payment_date) - 1 DAY) AS month_date,
              COALESCE(SUM(amount), 0) AS revenue
       FROM payments WHERE status = 'COMPLETED' AND payment_date >= ? AND payment_date <= ?
       GROUP BY month, month_date ORDER BY month_date`,
      [r.from, r.to],
    );
  }

  monthlyExpenses(r: DateRange, db: Db = this.pool) {
    return queryMany<MonthlyExpenseRow>(
      db,
      `SELECT DATE_FORMAT(expense_date, '%b ''%y') AS month,
              DATE_SUB(expense_date, INTERVAL DAYOFMONTH(expense_date) - 1 DAY) AS month_date,
              COALESCE(SUM(amount), 0) AS expenses
       FROM expenses WHERE expense_date >= ? AND expense_date <= ?
       GROUP BY month, month_date ORDER BY month_date`,
      [r.from, r.to],
    );
  }
}
