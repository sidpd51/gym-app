import { decimalOut } from '../plan/plan.model.js';

export interface PaymentRow {
  id: string;
  member_id: string;
  membership_id: string | null;
  amount: string;
  payment_method: string;
  payment_date: string;
  status: string;
  reference: string | null;
  notes: string | null;
  created_at: Date;
}

export interface PaymentResponse {
  id: string;
  memberId: string;
  membershipId: string | null;
  amount: string | null;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
}

export function toPaymentResponse(p: PaymentRow): PaymentResponse {
  return {
    id: p.id,
    memberId: p.member_id,
    membershipId: p.membership_id,
    amount: decimalOut(p.amount),
    paymentMethod: p.payment_method,
    paymentDate: p.payment_date,
    status: p.status,
    reference: p.reference,
    notes: p.notes,
    createdAt: p.created_at,
  };
}
