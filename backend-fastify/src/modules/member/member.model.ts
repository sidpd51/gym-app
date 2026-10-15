/** A row of the `members` table, as returned by the repository (snake_case, DB types). */
export interface MemberRow {
  id: string;
  member_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  status: string;
  joining_date: string;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Public API shape (camelCase). */
export interface MemberResponse {
  id: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  status: string;
  joiningDate: string;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toMemberResponse(m: MemberRow): MemberResponse {
  return {
    id: m.id,
    memberCode: m.member_code,
    firstName: m.first_name,
    lastName: m.last_name,
    phone: m.phone,
    email: m.email,
    status: m.status,
    joiningDate: m.joining_date,
    dateOfBirth: m.date_of_birth,
    gender: m.gender,
    address: m.address,
    emergencyContactName: m.emergency_contact_name,
    emergencyContactPhone: m.emergency_contact_phone,
    emergencyContactRelationship: m.emergency_contact_relationship,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  };
}
