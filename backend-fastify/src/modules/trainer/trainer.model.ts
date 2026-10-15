/** A row of the `trainers` table (snake_case, DB types). */
export interface TrainerRow {
  id: string;
  trainer_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  specialization: string | null;
  joining_date: string;
  status: string;
  created_at: Date;
}

/** A row of the `member_trainer_assignments` table. */
export interface AssignmentRow {
  id: string;
  member_id: string;
  trainer_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: Date;
}

export interface TrainerResponse {
  id: string;
  trainerCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  specialization: string | null;
  joiningDate: string;
  status: string;
  createdAt: Date;
}

export interface AssignmentResponse {
  id: string;
  memberId: string;
  trainerId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: Date;
}

export const toTrainerResponse = (t: TrainerRow): TrainerResponse => ({
  id: t.id,
  trainerCode: t.trainer_code,
  firstName: t.first_name,
  lastName: t.last_name,
  phone: t.phone,
  email: t.email,
  specialization: t.specialization,
  joiningDate: t.joining_date,
  status: t.status,
  createdAt: t.created_at,
});

export const toAssignmentResponse = (a: AssignmentRow): AssignmentResponse => ({
  id: a.id,
  memberId: a.member_id,
  trainerId: a.trainer_id,
  startDate: a.start_date,
  endDate: a.end_date,
  status: a.status,
  createdAt: a.created_at,
});
