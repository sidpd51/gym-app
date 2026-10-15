import type { Role } from '../../common/permissions.js';
import { exec, newId, queryMany, queryOne, type Db, type DbPool } from '../../db/pool.js';
import type { UserListRow, UserRow } from './user.model.js';
import type { UpdateProfileInput, UpdateUserInput } from './user.schemas.js';

const USER_COLS = `id, user_code, first_name, last_name, email, phone, role, status,
       password_hash, last_login_at, created_at`;

const FILTER = `WHERE (? IS NULL OR role = ?) AND (? IS NULL OR status = ?)`;
const filterParams = (f: { role?: string; status?: string }) => {
  const role = f.role || null;
  const status = f.status || null;
  return [role, role, status, status];
};

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
    return queryOne<UserRow>(db, `SELECT ${USER_COLS} FROM users WHERE id = ?`, [id]);
  }

  findByEmail(email: string, db: Db = this.pool) {
    return queryOne<UserRow>(db, `SELECT ${USER_COLS} FROM users WHERE email = ?`, [email]);
  }

  list(f: { role?: string; status?: string }, limit: number, offset: number, db: Db = this.pool) {
    return queryMany<UserListRow>(
      db,
      `SELECT id, user_code, first_name, last_name, email, phone, role, status, last_login_at, created_at
       FROM users ${FILTER} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...filterParams(f), limit, offset],
    );
  }

  async count(f: { role?: string; status?: string }, db: Db = this.pool): Promise<number> {
    const row = await queryOne<{ count: number }>(db, `SELECT COUNT(*) AS count FROM users ${FILTER}`, filterParams(f));
    return row!.count;
  }

  async insert(u: NewUser, db: Db = this.pool): Promise<UserRow> {
    const id = newId();
    await exec(
      db,
      `INSERT INTO users (id, user_code, first_name, last_name, email, phone, role, status, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      [id, u.userCode, u.firstName, u.lastName, u.email, u.phone, u.role, u.passwordHash],
    );
    return (await this.findById(id, db))!;
  }

  async update(id: string, req: UpdateUserInput, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE users
       SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
           phone = COALESCE(?, phone), role = COALESCE(?, role), status = COALESCE(?, status)
       WHERE id = ?`,
      [req.firstName ?? null, req.lastName ?? null, req.phone ?? null, req.role ?? null, req.status ?? null, id],
    );
    return matched ? this.findById(id, db) : undefined;
  }

  async updateProfile(id: string, req: Pick<UpdateProfileInput, 'firstName' | 'lastName' | 'phone'>, db: Db = this.pool) {
    const matched = await exec(
      db,
      `UPDATE users
       SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone)
       WHERE id = ?`,
      [req.firstName ?? null, req.lastName ?? null, req.phone ?? null, id],
    );
    return matched ? this.findById(id, db) : undefined;
  }

  updatePasswordHash(id: string, hash: string, db: Db = this.pool) {
    return exec(db, 'UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
  }

  touchLastLogin(id: string, db: Db = this.pool) {
    return exec(db, 'UPDATE users SET last_login_at = NOW(3) WHERE id = ?', [id]);
  }

  delete(id: string, db: Db = this.pool) {
    return exec(db, 'DELETE FROM users WHERE id = ?', [id]);
  }
}
