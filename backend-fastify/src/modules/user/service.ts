import bcrypt from 'bcryptjs';
import { auditLog } from '../../common/audit.js';
import { nextCode } from '../../common/codegen.js';
import { businessRule, conflict, notFound, badRequest } from '../../common/errors.js';
import { newPage, pageOffset, type PageQuery } from '../../common/pagination.js';
import type { Role } from '../../common/permissions.js';
import { isForeignKeyViolation, isUniqueViolation, queryMany, queryOne, withTx, exec, type DbPool } from '../../db/pool.js';

const BCRYPT_COST = 12;

const USER_COLS = `id, user_code, first_name, last_name, email, phone, role, status,
       password_hash, last_login_at, created_at`;

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

/** Public view of a user. Never includes the password hash. */
export function toUserResponse(u: UserRow) {
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

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  password: string;
}
export interface UpdateUserInput {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role?: Role | null;
  status?: string | null;
}
export interface UpdateProfileInput {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  currentPassword?: string | null;
  newPassword?: string | null;
}

export class UserService {
  constructor(readonly pool: DbPool) {}

  async getByID(id: string) {
    const row = await queryOne<UserRow>(this.pool, `SELECT ${USER_COLS} FROM users WHERE id = $1`, [id]);
    if (!row) throw notFound('USER_NOT_FOUND', 'User not found.');
    return toUserResponse(row);
  }

  /** Raw row (with password hash) for login; undefined when no such email. */
  getByEmail(email: string) {
    return queryOne<UserRow>(this.pool, `SELECT ${USER_COLS} FROM users WHERE lower(email) = lower($1)`, [email]);
  }

  verifyPassword(hash: string, plain: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  markLoggedIn(id: string) {
    return exec(this.pool, 'UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  }

  async list(q: PageQuery, f: { role?: string; status?: string }) {
    const where = `WHERE ($1::user_role IS NULL OR role = $1::user_role)
                     AND ($2::user_status IS NULL OR status = $2::user_status)`;
    const params = [f.role || null, f.status || null];
    const rows = await queryMany<UserRow>(
      this.pool,
      `SELECT id, user_code, first_name, last_name, email, phone, role, status, last_login_at, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [...params, q.pageSize, pageOffset(q)],
    );
    const total = (await queryOne<{ count: number }>(this.pool, `SELECT COUNT(*) FROM users ${where}`, params))!.count;
    return newPage(rows.map(toUserResponse), q.page, q.pageSize, total);
  }

  async create(actor: string, req: CreateUserInput) {
    const hash = await bcrypt.hash(req.password, BCRYPT_COST);
    const created = await withTx(this.pool, async (tx) => {
      const code = await nextCode(tx, 'user');
      let u: UserRow;
      try {
        u = (await queryOne<UserRow>(
          tx,
          `INSERT INTO users (user_code, first_name, last_name, email, phone, role, status, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7) RETURNING ${USER_COLS}`,
          [code, req.firstName, req.lastName, req.email.toLowerCase(), req.phone || null, req.role, hash],
        ))!;
      } catch (err) {
        if (isUniqueViolation(err)) throw conflict('USER_EMAIL_DUPLICATE', 'A user with this email already exists.');
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'CREATE', entityType: 'USER', entityId: u.id,
        entityName: `${u.first_name} ${u.last_name}`, description: `Created user ${u.email} (${u.role})`,
      });
      return u;
    });
    return toUserResponse(created);
  }

  async update(actor: string, id: string, req: UpdateUserInput) {
    const out = await withTx(this.pool, async (tx) => {
      const u = await queryOne<UserRow>(
        tx,
        `UPDATE users
         SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name),
             phone = COALESCE($4, phone), role = COALESCE($5::user_role, role), status = COALESCE($6::user_status, status)
         WHERE id = $1 RETURNING ${USER_COLS}`,
        [id, req.firstName ?? null, req.lastName ?? null, req.phone ?? null, req.role ?? null, req.status ?? null],
      );
      if (!u) throw notFound('USER_NOT_FOUND', 'User not found.');
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'USER', entityId: u.id,
        entityName: `${u.first_name} ${u.last_name}`, description: 'Updated user profile',
      });
      return u;
    });
    return toUserResponse(out);
  }

  async updateProfile(actor: string, req: UpdateProfileInput) {
    if (req.newPassword) {
      const existing = await queryOne<UserRow>(this.pool, `SELECT ${USER_COLS} FROM users WHERE id = $1`, [actor]);
      if (!existing) throw notFound('USER_NOT_FOUND', 'User not found.');
      if (!req.currentPassword) {
        throw badRequest('PROFILE_CURRENT_PASSWORD_REQUIRED', 'Current password is required to set a new password.');
      }
      if (!(await this.verifyPassword(existing.password_hash, req.currentPassword))) {
        throw badRequest('PROFILE_CURRENT_PASSWORD_INVALID', 'Current password is incorrect.');
      }
    }
    const newHash = req.newPassword ? await bcrypt.hash(req.newPassword, BCRYPT_COST) : null;

    const updated = await withTx(this.pool, async (tx) => {
      const u = await queryOne<UserRow>(
        tx,
        `UPDATE users
         SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name), phone = COALESCE($4, phone)
         WHERE id = $1 RETURNING ${USER_COLS}`,
        [actor, req.firstName ?? null, req.lastName ?? null, req.phone ?? null],
      );
      if (!u) throw notFound('USER_NOT_FOUND', 'User not found.');
      if (newHash) await exec(tx, 'UPDATE users SET password_hash = $2 WHERE id = $1', [actor, newHash]);
      await auditLog(tx, {
        userId: actor, action: 'UPDATE', entityType: 'USER', entityId: actor,
        entityName: `${u.first_name} ${u.last_name}`, description: 'Updated own profile',
      });
      return u;
    });
    return toUserResponse(updated);
  }

  async delete(actor: string, id: string) {
    if (actor === id) throw businessRule('USER_SELF_DELETE_FORBIDDEN', 'You cannot delete your own account.');
    await withTx(this.pool, async (tx) => {
      const existing = await queryOne<UserRow>(tx, `SELECT ${USER_COLS} FROM users WHERE id = $1`, [id]);
      if (!existing) throw notFound('USER_NOT_FOUND', 'User not found.');
      try {
        await exec(tx, 'DELETE FROM users WHERE id = $1', [id]);
      } catch (err) {
        if (isForeignKeyViolation(err)) {
          throw conflict('USER_REFERENCED', 'This user is referenced by audit logs and cannot be deleted.');
        }
        throw err;
      }
      await auditLog(tx, {
        userId: actor, action: 'DELETE', entityType: 'USER', entityId: id,
        entityName: `${existing.first_name} ${existing.last_name}`, description: `Deleted user ${existing.email}`,
      });
    });
  }
}
