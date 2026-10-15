/** One month of the revenue-vs-expenses series (amounts are decimal strings). */
export interface MonthlyPoint {
  month: string;
  revenue: string;
  expenses: string;
}

export interface MonthlyRevenueRow {
  month: string;
  revenue: string;
}

export interface MonthlyExpenseRow {
  month: string;
  expenses: string;
}

export interface OverviewResponse {
  revenue: string;
  expenses: string;
  netCashFlow: string;
  activeMembers: number;
  newMembers: number;
  attendanceCount: number;
  newLeads: number;
  revenueVsExpenses: MonthlyPoint[];
}

/** shopspring/decimal marshals as a quoted string with trailing zeros trimmed ("1500", "99.5"). */
export function decimalString(v: string | null | undefined): string {
  if (v === null || v === undefined) return '0';
  return v.includes('.') ? v.replace(/0+$/, '').replace(/\.$/, '') : v;
}
