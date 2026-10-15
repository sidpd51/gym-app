import { decimalOut } from '../plan/plan.model.js';

export interface MembershipRow {
  id: string;
  member_id: string;
  plan_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  amount: string;
  status: string;
  created_at: Date;
}

export interface MembershipResponse {
  id: string;
  memberId: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  amount: string | null;
  status: string;
  createdAt: Date;
}

export function toMembershipResponse(m: MembershipRow): MembershipResponse {
  return {
    id: m.id,
    memberId: m.member_id,
    planId: m.plan_id,
    planName: m.plan_name,
    startDate: m.start_date,
    endDate: m.end_date,
    amount: decimalOut(m.amount),
    status: m.status,
    createdAt: m.created_at,
  };
}

/** Plan columns a membership is created from. */
export interface PlanSnapshotRow {
  name: string;
  price: string;
  status: string;
  duration_in_days: number;
}
