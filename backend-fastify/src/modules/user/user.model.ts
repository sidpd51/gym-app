import type { Role } from '../../common/permissions.js';

/** A row of the `users` table (snake_case, DB types). */
export interface UserRow {
  id: string;
  user_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: string;
  password_hash: string;
  last_login_at: Date | null;
  created_at: Date;
}

/** List queries do not select the password hash. */
export type UserListRow = Omit<UserRow, 'password_hash'>;

/** Public view of a user. Never includes the password hash. */
export interface UserResponse {
  id: string;
  userCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export function toUserResponse(u: UserListRow): UserResponse {
  return {
    id: u.id,
    userCode: u.user_code,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at,
  };
}
