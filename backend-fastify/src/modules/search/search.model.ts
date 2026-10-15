export interface MemberHitRow { id: string; member_code: string; first_name: string; last_name: string; phone: string }
export interface TrainerHitRow { id: string; trainer_code: string; first_name: string; last_name: string; phone: string }
export interface LeadHitRow { id: string; lead_code: string; name: string; phone: string }

export interface SearchResponse {
  members: Array<{ id: string; memberCode: string; name: string; phone: string }>;
  trainers: Array<{ id: string; trainerCode: string; name: string; phone: string }>;
  leads: Array<{ id: string; leadCode: string; name: string; phone: string }>;
}

export function toSearchResponse(members: MemberHitRow[], trainers: TrainerHitRow[], leads: LeadHitRow[]): SearchResponse {
  return {
    members: members.map((r) => ({ id: r.id, memberCode: r.member_code, name: `${r.first_name} ${r.last_name}`, phone: r.phone })),
    trainers: trainers.map((r) => ({ id: r.id, trainerCode: r.trainer_code, name: `${r.first_name} ${r.last_name}`, phone: r.phone })),
    leads: leads.map((r) => ({ id: r.id, leadCode: r.lead_code, name: r.name, phone: r.phone })),
  };
}
