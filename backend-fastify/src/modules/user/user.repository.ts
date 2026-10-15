import type { Role } from '../../common/permissions.js';
import { exec, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { UserListRow, UserRow } from './user.model.js';
import type { UpdateProfileInput, UpdateUserInput } from './user.schemas.js';

const USER_COLS = `id, user_code, first_name, last_name, email, phone, role, status,
       password_hash, last_login_at, created_at`;

const FILTER = `WHERE ($1::user_role IS NULL OR role = $1::user_role)
                  AND ($2::user_status IS NULL OR status = $2::user_status)`;

export interface NewUser {
  userCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  passwordHash: string;
}

/** Data access for `users`: all SQL, no business rules. */
export class UserRepository {
  constructor(private readonly pool: DbPool) {}

  findById(id: string, db: Db = this.pool) {
    return queryOne<UserRow>(db, `SELECT ${USER_COLS} FROM users WHERE id = $1`, [id]);
  }

  findByEmail(email: string, db: Db = this.pool) {
    return queryOne<UserRow>(db, `SELECT ${USER_COLS} FROM users WHERE lower(email) = lower($1)`, [email]);
  }

  list(f: { role?: string; status?: string }, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<UserListRow>(
      db,
      `SELECT id, user_code, first_name, last_name, email, phone, role, status, last_login_at, created_at
       FROM users ${FILTER} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [f.role || null, f.status || null, limit, offset],
    );
  }

  async count(f: { role?: string; status?: string }, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) FROM users ${FILTER}`, [f.role || null, f.status || null]);
    return row!.count;
  }

  async insert(u: NewUser, db: Db = this.pool): Promise<UserRow> {
    const row = await queryOne<UserRow>(
      db,
      `INSERT INTO users (user_code, first_name, last_name, email, phone, role, status, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7) RETURNING ${USER_COLS}`,
      [u.userCode, u.firstName, u.lastName, u.email, u.phone, u.role, u.passwordHash],
    );
    return row!;
  }

  update(id: string, req: UpdateUserInput, db: Db = this.pool) {
    return queryOne<UserRow>(
      db,
      `UPDATE users
       SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name),
           phone = COALESCE($4, phone), role = COALESCE($5::user_role, role), status = COALESCE($6::user_status, status)
       WHERE id = $1 RETURNING ${USER_COLS}`,
      [id, req.firstName ?? null, req.lastName ?? null, req.phone ?? null, req.role ?? null, req.status ?? null],
    );
  }

  updateProfile(id: string, req: Pick<UpdateProfileInput, 'firstName' | 'lastName' | 'phone'>, db: Db = this.pool) {
    return queryOne<UserRow>(
      db,
      `UPDATE users
       SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name), phone = COALESCE($4, phone)
       WHERE id = $1 RETURNING ${USER_COLS}`,
      [id, req.firstName ?? null, req.lastName ?? null, req.phone ?? null],
    );
  }

  updatePasswordHash(id: string, hash: string, db: Db = this.pool) {
    return exec(db, 'UPDATE users SET password_hash = $2 WHERE id = $1', [id, hash]);
  }

  touchLastLogin(id: string, db: Db = this.pool) {
    return exec(db, 'UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM users WHERE id = $1', [id]);
  }
}
