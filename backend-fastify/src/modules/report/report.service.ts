import { decimalString, type MonthlyPoint, type OverviewResponse } from './report.model.js';
import type { ReportRepository } from './report.repository.js';
import type { DateRange } from './report.schemas.js';

export class ReportService {
  constructor(private readonly repo: ReportRepository) {}

  async overview(rng: DateRange): Promise<OverviewResponse> {
    const revenue = await this.repo.sumCompletedPayments(rng);
    const expenses = await this.repo.sumExpenses(rng);
    const net = await this.repo.subtract(revenue, expenses);

    const activeMembers = await this.repo.countActiveMembers();
    const newMembers = await this.repo.countNewMembers(rng);
    const attendanceCount = await this.repo.countAttendance(rng);
    const newLeads = await this.repo.countNewLeads(rng);

    const revRows = await this.repo.monthlyRevenue(rng);
    const expRows = await this.repo.monthlyExpenses(rng);

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
