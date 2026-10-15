/** A row of the `leads` table (snake_case, DB types). */
export interface LeadRow {
  id: string;
  lead_code: string;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
  interested_plan_id: string | null;
  status: string;
  notes: string | null;
  last_follow_up_date: string | null;
  next_follow_up_date: string | null;
  converted_member_id: string | null;
  created_at: Date;
}

/** Minimal member columns returned when a lead is converted. */
export interface ConvertedMemberRow {
  id: string;
  member_code: string;
}

export interface LeadResponse {
  id: string;
  leadCode: string;
  name: string;
  phone: string;
  email: string | null;
  source: string | null;
  interestedPlanId: string | null;
  status: string;
  notes: string | null;
  lastFollowUpDate: string | null;
  nextFollowUpDate: string | null;
  convertedMemberId: string | null;
  createdAt: Date;
}

export const toLeadResponse = (l: LeadRow): LeadResponse => ({
  id: l.id,
  leadCode: l.lead_code,
  name: l.name,
  phone: l.phone,
  email: l.email,
  source: l.source,
  interestedPlanId: l.interested_plan_id,
  status: l.status,
  notes: l.notes,
  lastFollowUpDate: l.last_follow_up_date,
  nextFollowUpDate: l.next_follow_up_date,
  convertedMemberId: l.converted_member_id,
  createdAt: l.created_at,
});
