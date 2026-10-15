/** pg NUMERIC string -> shopspring-style JSON string (trailing zeros trimmed: "1500.00" -> "1500"). */
export function decimalOut(v: string | null | undefined): string | null {
  if (v == null) return null;
  return v.includes('.') ? v.replace(/0+$/, '').replace(/\.$/, '') : v;
}

export const isPositive = (v: string) => Number(v) > 0;

export interface PlanRow {
  id: string;
  name: string;
  description: string | null;
  duration_in_days: number;
  price: string;
  status: string;
  created_at: Date;
}

export interface PlanResponse {
  id: string;
  name: string;
  description: string | null;
  durationInDays: number;
  price: string | null;
  status: string;
  createdAt: Date;
}

export function toPlanResponse(p: PlanRow): PlanResponse {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    durationInDays: p.duration_in_days,
    price: decimalOut(p.price),
    status: p.status,
    createdAt: p.created_at,
  };
}
